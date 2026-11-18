#!/usr/bin/env python3
"""Reference standard: ports and adapters without ceremony (Python 3.11+, stdlib only).

Dependencies point inward: HTTP adapter -> use case -> entity. The use case reaches storage
only through the `UserRepository` port, a structural Protocol (no base class to inherit).
- Invariants live in the entity: an invalid User cannot be constructed.
- Uniqueness is enforced atomically by the repository (a UNIQUE constraint in SQL, a lock
  here), never by find-then-save, so two concurrent sign-ups cannot both succeed.
- Expected failures are typed domain errors mapped to status codes in ONE place; anything
  else is logged with its traceback and answered with a generic 500 (nothing swallowed).
- Timestamps are timezone-aware UTC; ids are random UUIDs, not timestamps (no collisions).
"""

import json
import logging
import re
import threading
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol

log = logging.getLogger(__name__)

# ---- Entity: pure domain rules, no I/O ----------------------------------------------------

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})+")  # linear


class DomainError(Exception):
    """Expected business-rule failure; its message is safe to show to clients."""


class InvalidUser(DomainError): ...


class EmailTaken(DomainError): ...


@dataclass(frozen=True, slots=True)
class User:
    id: str
    email: str
    username: str
    created_at: datetime

    def __post_init__(self) -> None:
        if len(self.email) > 254 or not EMAIL_RE.fullmatch(self.email):
            raise InvalidUser("Invalid email address.")
        if not (3 <= len(self.username) <= 30 and self.username.isprintable()):
            raise InvalidUser("Username must be 3-30 printable characters.")
        if self.created_at.utcoffset() is None:
            raise ValueError("created_at must be timezone-aware")  # programming error -> 500


# ---- Port + use case: application logic, storage-agnostic ---------------------------------

class UserRepository(Protocol):
    def add(self, user: User) -> None:
        """Persist a new user atomically; raise EmailTaken if the email is registered."""
        ...


def register_user(users: UserRepository, email: str, username: str) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=email.strip().lower(),
        username=username.strip(),
        created_at=datetime.now(UTC),
    )
    users.add(user)
    return user


# ---- Adapters: storage and HTTP -----------------------------------------------------------

class InMemoryUserRepository:
    """Test/demo adapter. Satisfies UserRepository structurally."""

    def __init__(self) -> None:
        self._by_email: dict[str, User] = {}
        self._lock = threading.Lock()

    def add(self, user: User) -> None:
        with self._lock:  # check and insert as one atomic step
            if user.email in self._by_email:
                raise EmailTaken("Email is already registered.")
            self._by_email[user.email] = user


MAX_BODY_CHARS = 16_384


def _error(message: str, status: int) -> tuple[str, int]:
    return json.dumps({"error": message}), status


def handle_register(users: UserRepository, body: str) -> tuple[str, int]:
    """HTTP adapter: JSON text in, (JSON text, status) out."""
    if len(body) > MAX_BODY_CHARS:
        return _error("Payload too large.", 413)
    try:
        payload = json.loads(body)
    except (ValueError, RecursionError):  # bad JSON, >4300-digit ints, deep nesting
        return _error("Malformed JSON.", 400)
    if not isinstance(payload, dict) or not all(
        isinstance(payload.get(k), str) for k in ("email", "username")
    ):
        return _error("Fields 'email' and 'username' must be strings.", 400)

    try:
        user = register_user(users, payload["email"], payload["username"])
    except EmailTaken as e:
        return _error(str(e), 409)
    except InvalidUser as e:
        return _error(str(e), 422)
    except Exception:
        log.exception("register_user failed")  # full traceback to logs, nothing to client
        return _error("Internal server error.", 500)

    return json.dumps({
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "created_at": user.created_at.isoformat(),
    }), 201


# ---- Composition root ---------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig()
    repo = InMemoryUserRepository()
    for raw in (
        '{"email": "Dev@Example.com", "username": "clean_dev"}',  # 201
        '{"email": "dev@example.com ", "username": "other_dev"}',  # 409 after normalisation
        '{"email": "bad-email", "username": "ok_name"}',  # 422
        '["not", "an", "object"]',  # 400
    ):
        body, status = handle_register(repo, raw)
        print(status, body)
