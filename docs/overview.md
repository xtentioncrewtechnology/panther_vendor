# Vendor — overview

## What it is

Before this flow, admin “approve” on a bank-transfer withdrawal marked the request **approved/completed** even though money still had to be sent by hand.

Vendor splits that into two steps:

1. **Admin approve** → “OK to pay out” (`processing` + `VendorTransfer` job)
2. **Vendor submit** → “Money sent + proof attached” (`approved` / `completed`)

There is **no** second admin final-approve. Vendor submit closes the withdrawal.

## Who does what

| Actor | App | Permission / role | Job |
|-------|-----|-------------------|-----|
| Client / IB / FM | Portal | Own wallet JWT | Creates bank-transfer withdrawal; **funds debited immediately**; PR stays `pending` |
| Admin | Main admin | `payment_requests.approve` / `reject` | First-approve → `processing` + vendor row; or reject + reverse funds |
| Vendor | **This app** (Vendor Portal UI) | Staff + RBAC role **Vendor** (`vendor.view`, `vendor.submit`) | Pays user’s bank, uploads proof + UTR URL, submit or reject |

Vendor staff use the **same admin login** (`POST /admin/login`). `User.role` stays `staff`; access is via RBAC role **Vendor**.

## Apps in this workspace

```text
vendor-portal (this package)   Vendor Queue UI (Vue 3 + Vite)
backend API                    Flask API (vendor_bp under /admin/vendor)
```

| Frontend route | Page |
|----------------|------|
| `/auth/login` | Production login |
| `/auth/dev-login` | Login + custom API base (tunnels / local) |
| `/dashboard` | Placeholder home |
| `/profile` | Staff profile |
| `/vendor/transfers` | **Vendor Queue** (main feature) |

API base (axios): `{host}/admin/`  
Default host: set via Dev Login (`localStorage.custom_base_url`) or `VITE_API_HOST`  
Override: `localStorage.custom_base_url` (set from Dev Login).

## Auth

All vendor and admin APIs:

```http
Authorization: Bearer <jwt_access_token>
```

| Permission | Used for |
|------------|----------|
| `vendor.view` | List + get transfers |
| `vendor.submit` | PATCH draft + POST submit |
| `payment_requests.approve` | Admin first approve (creates vendor job) |
| `payment_requests.reject` | Reject pending **or** processing (vendor reject UI uses this) |

Superadmin JWT role bypasses permission checks.

On API startup, role **Vendor** is seeded with `vendor.view` + `vendor.submit`. Assign that role to payout staff.

## Status reference

### PaymentRequest (bank-transfer withdrawal)

| Stage | `approval_status` | `payment_status` |
|-------|-------------------|------------------|
| User creates | `pending` | `paid` |
| Admin first approve | `processing` | `paid` |
| Vendor submits | `approved` | `completed` |
| Reject | `rejected` | unchanged |

### VendorTransfer

| `status` | Meaning |
|----------|---------|
| `assigned` | Open in vendor queue |
| `completed` | Vendor submitted; withdrawal done |
| `cancelled` | Rejected while processing |

Client / portal UIs should treat `processing` as “payout in flight”, not “approved”.

## Wallet sources vendors may pay

Vendor does not own wallets. Each transfer points at one already-debited source:

| Source | Typical create path |
|--------|---------------------|
| Trading account | `POST /client/wallet/create-bank-transfer-withdrawal` |
| FM commission wallet | `POST /fm/wallet/create-bank-transfer-withdrawal` |
| IB wallet | `POST /ib/wallet/create-bank-transfer-withdrawal` |

Serialized transfer includes `trading_account_id` / `fm_wallet_id` / `ib_wallet_id` and `payment_request.bank` for remittance.

## Out of scope

- Creating deposits / withdrawals
- Crypto (Coinsbuy) / Paymaxis
- IB commission engine, settlements, MT5
- Full admin payment-request UI (lives in main admin, not this app)
