#!/usr/bin/env python3
"""Reference standard: validation at the trust boundary (Python 3.11+, stdlib only).

- Parse, don't validate: untrusted `object` in, a frozen typed value out, or ONE
  ValidationError carrying every field error (contract: field -> message, never partial data).
- Bounded work: lengths are checked before regexes; patterns use fullmatch and are
  unambiguous (no nested overlapping quantifiers), so matching is linear - no ReDoS.
- Allowlist: only declared fields are copied, so extra keys cannot mass-assign.
- Store raw, encode on output: HTML/SQL escaping belongs to the template engine and the
  driver's bound parameters, not to input handling (escaping here corrupts data).
- Secrets stay secret: the password is excluded from repr and never echoed back.
"""

import json
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any

EMAIL_MAX = 254  # RFC 5321 forward-path limit
# Shape check only; ownership is proven by a confirmation email, not by a regex.
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})+")
USERNAME_RE = re.compile(r"[A-Za-z0-9_]{3,20}")
# NIST SP 800-63B-4: length, not composition rules; 15 for single-factor (8 if MFA is enforced).
# Also check a breached-password list and hash with Argon2id/scrypt (bcrypt truncates at 72 bytes).
PASSWORD_MIN, PASSWORD_MAX = 15, 128
BIO_MAX = 500
AGE_MIN, AGE_MAX = 13, 120


class ValidationError(ValueError):
    """Raised with every invalid field at once, so clients can fix the form in one round trip."""

    def __init__(self, errors: dict[str, str]) -> None:
        super().__init__(f"Invalid fields: {', '.join(errors)}")
        self.errors = errors


@dataclass(frozen=True, slots=True, kw_only=True)
class Registration:
    email: str
    username: str
    password: str = field(repr=False)
    age: int
    bio: str = ""


def parse_registration(payload: object) -> Registration:
    """Return a Registration or raise ValidationError listing every invalid field."""
    if not isinstance(payload, dict):
        raise ValidationError({"body": "Expected a JSON object."})
    data: dict[str, Any] = payload
    errors: dict[str, str] = {}

    def text(name: str, max_len: int, *, required: bool = True, strip: bool = True) -> str:
        value = data.get(name)
        if value is None:
            if required:
                errors[name] = "Required."
            return ""
        if not isinstance(value, str):
            errors[name] = "Must be a string."
            return ""
        value = value.strip() if strip else value
        if len(value) > max_len:
            errors[name] = f"Must be at most {max_len} characters."
        return value

    email = text("email", EMAIL_MAX)
    if "email" not in errors and not EMAIL_RE.fullmatch(email):
        errors["email"] = "Invalid email address."

    username = text("username", 20)
    if "username" not in errors and not USERNAME_RE.fullmatch(username):
        errors["username"] = "Use 3-20 characters: letters, digits, underscore."

    password = text("password", PASSWORD_MAX, strip=False)  # never alter a secret
    if "password" not in errors and len(password) < PASSWORD_MIN:
        errors["password"] = f"Must be at least {PASSWORD_MIN} characters."

    bio = text("bio", BIO_MAX, required=False)
    if "bio" not in errors and any(unicodedata.category(c) == "Cc" and c not in "\n\t" for c in bio):
        errors["bio"] = "Must not contain control characters."  # e.g. NUL breaks PostgreSQL text

    age = data.get("age")
    if age is None:
        errors["age"] = "Required."
    elif type(age) is not int:  # bool is a subclass of int: True must not pass as 1
        errors["age"] = "Must be an integer."
    elif not AGE_MIN <= age <= AGE_MAX:
        errors["age"] = f"Must be between {AGE_MIN} and {AGE_MAX}."

    if errors:
        raise ValidationError(errors)
    return Registration(email=email, username=username, password=password, age=age, bio=bio)


if __name__ == "__main__":
    requests = [
        {"email": " dev@example.com ", "username": "clean_dev", "password": "correct horse battery",
         "age": 28, "bio": "<b>Raw text is stored as-is; the template escapes it.</b>", "role": "admin"},
        {"email": "bad@", "username": "ab", "password": "Short1!", "age": True},
        ["not", "an", "object"],
    ]
    for body in requests:
        try:
            print("OK  ", parse_registration(body))  # repr hides the password; "role" was dropped
        except ValidationError as e:
            print("422 ", json.dumps(e.errors))
