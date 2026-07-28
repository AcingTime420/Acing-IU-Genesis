# ADR-0005: Nginx as Genesis API gateway

- **Status:** Accepted (Genesis)  

## Decision

Use **Nginx** in Docker Compose to route:

- `/api/auth/*` → identity:8080  
- `/api/trust/*` → device-trust:8081  
- `/api/firmware/*` → 503 until S4  

Inject `X-Request-Id` / `X-Correlation-Id`.

## Consequences

- Fast to ship; no .NET YARP dependency in Genesis  
- Future ADR may replace with YARP or Envoy for mTLS service mesh  
