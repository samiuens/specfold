## Delta

```yaml
ops:
  - op: create
    path: capabilities/guest-checkout.md
    type: Capability
    summary: Why guest checkout exists.
  - op: create
    path: decisions/guest-orders.md
    type: Decision
    summary: Guest orders get no account.
  - op: deprecate
    path: decisions/old-checkout.md
    type: Decision
    summary: Accounts are no longer required.
empty_reason: ""
```
