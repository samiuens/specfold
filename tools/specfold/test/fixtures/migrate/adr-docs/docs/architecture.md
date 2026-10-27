# Architecture

Requests enter through `src/index.js`, which routes `/orders` to `src/orders.js`. Orders are written to PostgreSQL in one transaction per request. Sessions use signed cookies (see ADR 0003).
