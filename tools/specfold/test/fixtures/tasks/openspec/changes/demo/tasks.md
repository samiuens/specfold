# Tasks

## 1. Checkout

```yaml
files: [src/checkout/**]
scenarios: [checkout#guest-pays-without-account]
```

- [x] 1.1 Add guest payment
  - Done when: scenario checkout#guest-pays-without-account passes

## 2. Receipt

```yaml
files: [src/mail/**]
scenarios: [mail#receipt-sent]
```

- [ ] 2.1 Mail the receipt
  - Done when: scenario mail#receipt-sent passes
- [ ] 2.2 Add the receipt template
  - Done when: npm test -- receipt passes

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2]
```

- [ ] 3.1 Write the capability card
  - Done when: specfold validate exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync demo`.
