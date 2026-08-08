# Operations runbooks — Genesis

## RB-01: Stack will not start

1. `docker compose ps` — which service unhealthy?  
2. `docker compose logs identity --tail 100`  
3. Common: JWT_SIGNING_KEY too short (<32) → identity crash loop  
4. Common: Postgres not ready → wait for healthcheck; check volume permissions  

## RB-02: Auth 401 after successful login

1. Confirm `Authorization: Bearer` header  
2. Check Redis up: `docker compose exec redis redis-cli -a "$REDIS_PASSWORD" PING`  
3. Logout blacklists jti — expected 401 after logout  
4. Clock skew: token `exp` vs container time  

## RB-03: Trust score always 0

1. Verify `isRooted: false` in JSON body  
2. Confirm SELinux string is exactly `Enforcing` (case-insensitive in engine)  
3. Read audit: `SELECT * FROM security_audit_logs WHERE event_type LIKE 'trust%' ORDER BY id DESC LIMIT 20;`  

## RB-04: Rotate JWT signing key

1. Schedule maintenance window  
2. Update secret → `docker compose up -d identity device-trust`  
3. All existing access tokens invalidate (signature fail)  
4. Users re-login; refresh tokens still valid until family expiry unless forced logout  

## RB-05: Database backup

```bash
docker compose exec -T postgres pg_dump -U acing acing_iu | gzip > backup-$(date +%F).sql.gz
```

## RB-06: Suspected refresh token theft

1. Identify `family_id` from `refresh_tokens`  
2. `UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = '...'`  
3. Optionally flush Redis keys `revoked:*` not required for family kill  
4. Force password reset for user  
