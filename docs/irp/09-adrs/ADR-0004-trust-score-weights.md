# ADR-0004: Device trust score weights

- **Status:** Accepted  

## Decision

| Signal | Points |
|--------|--------|
| SELinux Enforcing | +40 |
| Bootloader locked | +30 |
| Partitions unmodified | +20 |
| Knox warranty fuse intact | +10 |
| Device rooted | **force score 0** |

Threshold default **80** from `policy_configurations.policy_key = trust.score.threshold`.

## Consequences

- Matches MASTER_IMPLEMENTATION_PLAN S3  
- Policy table allows threshold change without redeploy  
- Future: signed attestation blobs may replace self-reported telemetry (new ADR)  
