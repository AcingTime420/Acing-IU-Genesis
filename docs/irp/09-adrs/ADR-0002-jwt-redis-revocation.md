# ADR-0002: HS256 JWT + Redis access-token revocation + refresh families

- **Status:** Accepted  

## Decision

- Access tokens: JWT HS256, short TTL (15m), claims `sub`, `email`, `jti`, `roles`  
- Revocation: Redis key `revoked:access:{jti}` with TTL ≈ remaining token life  
- Refresh: opaque token, SHA-256 hash in Postgres, **family_id** rotation; reuse of revoked family invalidates all  
- Transport: refresh also set as HttpOnly Secure SameSite=Strict cookie `acing_refresh`  

## Consequences

- Stateless resource servers still need Redis for logout/blacklist  
- Symmetric key simplifies Genesis; migrate to RS256/JWKS when external clients proliferate (future ADR)  
