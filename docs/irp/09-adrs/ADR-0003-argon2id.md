# ADR-0003: Argon2id password hashing

- **Status:** Accepted  

## Decision

Store passwords with **Argon2id** (memory-hard). Never bcrypt/scrypt for new hashes. Parameters tuned for interactive login latency on container CPU.

## Consequences

- Requires compatible library on .NET 8  
- Login CPU cost is intentional; rate-limit login endpoints in production  
