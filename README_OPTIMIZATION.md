# Performance Optimization Details

**What**: The optimization replaces sequential `updateDoc` calls with `writeBatch` in the AI attack logic and human attack logic (`handleHexClick`) within `src/App.tsx`.
**Why**: Making sequential network requests forces the application to wait for the first request to finish before starting the second, doubling network roundtrip latency in the worst case. Batched writes bundle multiple write operations into a single network request.
**Measured Improvement**: The improvement scales with network latency. Over a 100ms connection, batched writes halve network latency from 200ms down to 100ms. Since we do not have an automated performance benchmark pipeline for this local environment due to lack of `node_modules`, we estimate roughly a 50% reduction in attack-related Firestore operation latency.
