# Tasks

## 1. Checkout

```yaml
files: [src/checkout/**]
scenarios: [guest-checkout#guest-pays-without-account]
```

- [ ] 1.1 Add guest payment
  - Done when: scenario guest-checkout#guest-pays-without-account passes

## 2. Mail

```yaml
files: [src/mail/**]
```

- [ ] 2.1 Mail the receipt
  - Done when: npm test -- mail passes

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2]
```

- [ ] 3.1 Write the capability card
  - Done when: specfold validate exits 0
