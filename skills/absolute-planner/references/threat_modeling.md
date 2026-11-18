# Threat Modeling and Security Compliance Reference

Use this reference to conduct thorough Threat Modeling (STRIDE) and Security/Audit Compliance reviews.

## STRIDE Threat Modeling Framework

Analyze every component, data flow, and interface boundary against the six STRIDE threat categories.

| Threat Category | Description | Target Security Attribute | Typical Mitigation Strategies |
|---|---|---|---|
| **Spoofing** | Pretending to be someone or something else. | **Authenticity** | - Multi-Factor Authentication (MFA)<br>- Cryptographic signatures (JSON Web Tokens)<br>- Mutual TLS (mTLS) for microservices<br>- IP Whitelisting / VPC Ingress controls |
| **Tampering** | Modifying data on disk or in transit. | **Integrity** | - HTTPS/TLS 1.3 encryption in transit<br>- IPsec / VPN tunnels<br>- Hash-based Message Authentication Codes (HMAC)<br>- Database row-level checksums<br>- Write-Once-Read-Many (WORM) storage |
| **Repudiation** | Claiming you did not perform an action. | **Non-Repudiability** | - Cryptographically signed transaction logs<br>- Immutable audit trails (AWS CloudTrail, Ledger DB)<br>- Centralized, write-only log aggregation (SIEM)<br>- Structured metadata binding (IP, Timestamp, User ID) |
| **Information Disclosure** | Exposing sensitive data to unauthorized actors. | **Confidentiality** | - AES-256 encryption at rest (KMS key rotation)<br>- Dynamic data masking / tokenization<br>- Strict Least-Privilege access controls (IAM Roles)<br>- Transport Layer Security (TLS)<br>- Database columns encryption |
| **Denial of Service (DoS)** | Exhausting resources to block legitimate users. | **Availability** | - Rate limiting (Token Bucket/Leaky Bucket)<br>- Web Application Firewall (WAF) IP blocking<br>- Auto-scaling groups & Load balancers<br>- CDN caching and Edge protection (AWS Shield)<br>- Connection pool tuning / Timeout configurations |
| **Elevation of Privilege** | Gaining unauthorized access rights. | **Authorization** | - Role-Based Access Control (RBAC)<br>- Attribute-Based Access Control (ABAC)<br>- Parameterized input queries (Prevent SQLi/Command Injection)<br>- Container isolation (non-root execution)<br>- Strict API endpoint policy checks |

---

## Business-Logic Abuse (commerce, money, credits) — check these before STRIDE
| Threat | Typical mitigation | Test |
|---|---|---|
| Code/voucher enumeration (gift cards, promo codes, invite links) | ≥ 80 bits of randomness, rate limits per IP/account/card, lockout + alerting on bursts | brute-force script hits the limit; codes are not sequential |
| Fraud cash-out (stolen cards → gift cards → resale) | velocity limits on purchase, delayed activation or manual review above a threshold, PSP fraud signals | buying N cards in M minutes is held for review |
| Double spend / race on balance | single atomic conditional update or row lock; idempotency key per redemption | 50 parallel redemptions never exceed the balance |
| Replayed or out-of-order payment callbacks | verify signature, idempotency on provider transaction id, state machine that ignores stale transitions | replayed `success` after `refund` changes nothing |
| Refund loops (refund to card while keeping credit, or refund credit to cash) | refund to the original instrument only, reverse credits on refund, ledger reconciliation | refund after partial redemption leaves balances consistent |
| Promo stacking / negative totals | server-side price computation, floor at zero, explicit stacking rules | crafted cart cannot produce a negative or below-cost total |
| Privilege mix-ups (support tools, admin APIs) | separate roles, audit log of every manual balance change | support role cannot mint credit without approval |
| Expiry/timezone edge cases | store UTC, compute business periods in the business time zone, define inclusive/exclusive bounds | redemption at 23:59/00:00 local time lands in the right period |

## Security Compliance Checklists

Every system plan must satisfy compliance parameters where applicable.

### 1. SOC2 Type II Readiness
- **Access Control**: Provision IAM users via Single Sign-On (SSO) with MFA. No shared credentials.
- **Change Management**: Audit logging of all deployment pipelines. Code reviews (PR approvals) required.
- **Vulnerability Management**: Automated static analysis (SAST) and dependency vulnerability scans (Snyk/Trivy) in CI/CD.
- **Incident Response**: Immutable log storage in isolated S3 buckets with Object Lock enabled. Alerting thresholds for authorization failures.
- **System Monitoring**: Centralized dashboards monitoring resource utilization, latency, and request success rates.

### 2. GDPR (General Data Protection Regulation) Compliance
- **Consent Management**: Explicit consent collection and storage mechanism.
- **Right to be Forgotten (Erasure)**: Clear architectural path to delete all user records from active databases, backups, caches, and logs within 30 days. Hard delete or crypto-shredding (deleting encryption keys for user-specific data).
- **Data Minimization**: Avoid storing unnecessary PII (Personally Identifiable Information). Strip logs of emails, passwords, and tokens.
- **Encryption**: Double encryption for PII (application-level envelope encryption + database-level transparent data encryption).
- **Data Portability**: JSON export endpoint for user-profile and transaction data.

### 3. PCI-DSS (Payment Card Industry Data Security Standard) Compliance
- **Scope Reduction**: Delegate payment tokenization to third-party processors (Stripe, Braintree). Never let credit card numbers touch the application servers or databases directly.
- **Encryption**: Protect stored cardholder data (CHD) with strong cryptography (AES-256).
- **Network Segmentation**: Isolate any cardholder data environment (CDE) using firewalls and separate subnets.
- **Access Tracking**: Log and audit all access to CDE resources. Log retention for minimum 1 year.
- **Penetration Testing**: Regular quarterly vulnerability scans and annual external penetration testing.
