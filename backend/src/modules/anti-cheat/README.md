# Anti-Cheat Module

## Layers

1. **Client** — GPS accuracy, accelerometer fusion, mock/root flags in `gps:update` payload
2. **AntiCheatEngine** — rule-based validation per GPS sample
3. **Trust score** — cumulative user reputation in `users.trust_score`
4. **Persistence** — `anti_cheat_logs` for admin review and ML training export
5. **ML pipeline** — `enqueueMlAnalysis()` posts batches to `ML_CHEAT_WEBHOOK_URL`

## Extending with ML

Train on: GPS sequences, sensor magnitude variance, cadence correlation, finish times vs rank.

Store model version in `anti_cheat_logs.metadata` for auditability.
