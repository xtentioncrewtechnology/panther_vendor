# Vendor docs

Guide for the **Vendor Queue** product: staff who manually pay out **bank-transfer withdrawals** after admin first-approve.

| Doc | What it covers |
|-----|----------------|
| [Overview](./overview.md) | Purpose, actors, apps, auth, statuses |
| [Flow](./flow.md) | End-to-end journey (user → admin → vendor) |
| [API reference](./api.md) | Every API involved (vendor + admin + upstream create) |

**Repos**

| Piece | Path |
|-------|------|
| Vendor UI | `panther_vendor_frontend/` |
| Vendor backend package | `panther-trade/app/payments/vendor/` |
| Backend docs | `panther-trade/docs/vendor/` |

Vendor does **not** create withdrawals. It only completes bank-transfer payouts that are already in `processing`. Crypto / Paymaxis are out of scope.
