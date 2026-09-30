# Vendor — API reference

**Auth (all routes below unless noted):**

```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json   # or multipart/form-data where noted
```

**Base URLs**

| Surface | Prefix |
|---------|--------|
| Staff / vendor APIs | `/admin/...` |
| Client wallet | `/client/wallet/...` |
| FM wallet | `/fm/wallet/...` |
| IB wallet | `/ib/wallet/...` |

Vendor frontend axios base = `{host}/admin/` (paths below are shown as full paths).

Error envelope:

```json
{ "status": "error", "message": "Human readable reason" }
```

Common codes: `400` validation/state, `401` auth, `403` permission, `404` not found, `500` unexpected.

---

## A. Auth & profile (vendor frontend)

### A1. Login

`POST /admin/login`  
Used by: Login, Dev Login

**Body**

```json
{
  "email": "vendor@example.com",
  "password": "••••••••"
}
```

**Success:** JWT access token (store as Bearer). Staff user should have RBAC role **Vendor**.

---

### A2. Profile

`GET /admin/profile`  
Used by: Profile page, NavBar

**Success:** staff profile payload (name, email, etc.).

---

## B. Vendor queue (`/admin/vendor`)

Blueprint: `vendor_bp` → `app/payments/vendor/routes.py`

### Shared payload: `VendorTransfer`

Returned in `data` for list / get / patch / submit / reject:

```json
{
  "id": 12,
  "payment_request_id": 455,
  "status": "assigned",
  "assigned_to": 42,
  "assigned_to_name": "Vendor Staff",
  "assigned_to_email": "vendor@example.com",
  "proof_attachment": "vendor_transfers/12/3/xxx.pdf",
  "proof_attachment_url": "https://cdn.example.com/vendor_transfers/12/3/xxx.pdf",
  "proof_url": "https://bank.example/utr/123",
  "vendor_note": "Sent via IMPS",
  "submitted_by": null,
  "submitted_at": null,
  "created_at": "2026-09-25T07:30:00",
  "updated_at": "2026-09-25T07:31:00",
  "payment_request": {
    "id": 455,
    "type": "withdrawal",
    "gateway": "bank_transfer",
    "method": "Bank Transaction",
    "approval_status": "processing",
    "payment_status": "paid",
    "amount": 10.0,
    "currency": "USD",
    "paid_amount": 850.0,
    "paid_currency": "INR",
    "conversion_rate": {
      "payment_currency": "INR",
      "account_currency": "USD",
      "units_per_usd": 85.0
    },
    "converted_at": "2026-09-25T07:00:00",
    "user_id": 88,
    "user_email": "user@example.com",
    "user_name": "Jane Doe",
    "trading_account_id": 101,
    "trading_account_number": "5012345",
    "fm_wallet_id": null,
    "ib_wallet_id": null,
    "reference_id": "uuid-...",
    "bank": {
      "account_number": "1234567890",
      "account_name": "Jane Doe",
      "account_type": "savings",
      "bank": "HDFC",
      "bank_branch_code": "HDFC0001234",
      "user_bank_account_id": 7,
      "deposit_proof_url": null
    },
    "created_at": "2026-09-25T07:00:00"
  }
}
```

Use transfer **`id`** on vendor routes (not payment request id).  
`proof_attachment_url` = uploaded file CDN URL.  
`proof_url` = vendor UTR / remittance link.  
`assigned_to_name` / `assigned_to_email` = connected vendor staff (from `assigned_to`).  
`payment_request.conversion_rate` = locked FX snapshot (`1 USD = units_per_usd` of `payment_currency`); `null` if not stored.  
`payment_request.converted_at` = when that rate was locked.

Proof file rules: `png` / `jpg` / `jpeg` / `gif` / `webp` / `pdf`, max **10 MB**.

---

### B1. List transfers

`GET /admin/vendor/transfers`  
Permission: `vendor.view` (unscoped with `vendor.view_all`)  
Used by: Vendor Queue page

| Query | Type | Notes |
|-------|------|--------|
| `status` | string | `assigned` / `completed` / `cancelled` |
| `type` | string | `deposit` / `withdrawal` |
| `assigned_to` | int | staff user id; only when caller has `vendor.view_all` or is non-staff |
| `page` | int | default `1` |
| `per_page` | int | default `20`, max `100` |

Staff without `vendor.view_all`: filtered to `assigned_to` = current user.  
Staff with `vendor.view_all` / non-staff: all jobs; optional `assigned_to` query.


**Success `200`**

```json
{
  "status": "success",
  "data": [ /* VendorTransfer[] */ ],
  "pagination": { "page": 1, "per_page": 20, "total": 0 }
}
```

---

### B2. Get one transfer

`GET /admin/vendor/transfers/<transfer_id>`  
Permission: `vendor.view`

Scoped staff (no `vendor.view_all`) get `404` if the transfer is not assigned to them.

**Success `200`:** `{ "status": "success", "data": { /* VendorTransfer */ } }`  
**Not found `404`:** `{ "status": "error", "message": "Vendor transfer not found" }`

---

### B3. Update transfer (draft — does **not** complete)

`PATCH /admin/vendor/transfers/<transfer_id>`  
Permission: `vendor.submit`  
Used by: Save Draft / amount adjust  
Only while transfer `assigned`. Deposit amount adjust requires PR `processing`.

Multipart **or** JSON. At least one field required.

| Field | Notes |
|-------|--------|
| `proof` | file |
| `proof_url` or `url` | remittance / UTR link |
| `vendor_note` or `note` | empty string clears |
| `assigned_to` | staff user id; `0` / empty clears |
| `amount` or `paid_amount` | **Deposit only (INR)**. If changed vs current, sets `vendor_amount_adjusted` and moves PR to `pending` (admin must approve before credit) |

**JSON example**

```json
{
  "proof_url": "https://bank.example/utr/123",
  "vendor_note": "IMPS done",
  "assigned_to": 42
}
```

**Deposit amount adjust**

```json
{ "amount": 2500 }
```

**Success `200`**

```json
{
  "status": "success",
  "message": "Vendor transfer updated",
  "data": { }
}
```

When amount was changed, message indicates admin approval is required. List/detail `payment_request` includes:

- `vendor_amount_adjusted` (bool)
- `original_paid_amount` (INR before first vendor adjust)

---

### B4. Submit (completes withdrawal or confirms deposit)

`POST /admin/vendor/transfers/<transfer_id>/submit`  
Permission: `vendor.submit`  
`Content-Type: multipart/form-data`  
Used by: Complete Transfer / Confirm deposit

| Field | Required | Notes |
|-------|----------|--------|
| `proof` | yes* for withdrawal | *or already saved via PATCH; optional for deposit if user proof exists |
| `proof_url` or `url` | yes* for withdrawal | *or already saved; **optional for deposit** when user UTR/proof already on the PR |
| `vendor_note` or `note` | no | optional |

Blocked for deposits with `vendor_amount_adjusted` while still `pending` (awaiting admin).

Deposit confirm: vendor UTR is optional if the payment request already has user UTR/txid or deposit proof; otherwise attach vendor UTR or proof.

**Effects**

- `VendorTransfer.status` → `completed`
- `submitted_by` / `submitted_at` set
- PR `approval_status` → `approved`
- PR `payment_status` → `completed`
- Deposit: credits trading account
- `approved_by` = vendor user id

**Success `200`**

```json
{
  "status": "success",
  "message": "Vendor transfer submitted and withdrawal completed",
  "data": {
    "status": "completed",
    "payment_request": {
      "approval_status": "approved",
      "payment_status": "completed"
    }
  }
}
```

---

### B5. Reject deposit or withdrawal

`POST /admin/vendor/transfers/<transfer_id>/reject`  
Permission: `payment_requests.reject` (seeded on Vendor role; not `vendor.submit`)  
Used by: Reject action in Vendor Queue

**Body** (JSON or form) — **required**

```json
{ "rejection_reason": "Wrong bank details" }
```

Aliases: `reason`. Empty / missing → `400` `"rejection_reason is required"`.

**Effects**

- `VendorTransfer.status` → `cancelled`
- PR `approval_status` → `rejected`, `rejection_reason` set
- Deposit: no fund reverse (nothing credited yet)
- Withdrawal: funds reversed to trading account / FM / IB wallet

**Success `200`**

```json
{
  "status": "success",
  "message": "Vendor transfer rejected",
  "data": { }
}
```

---

## C. Admin payment-request hooks (create / cancel vendor jobs)

Not built into the vendor Vue app (main admin uses these). Required for the flow to start.

### C1. First approve → creates vendor row (withdrawals)

`POST /admin/payment-requests/approve/<req_id>`  
Permission: `payment_requests.approve`  
Optional multipart: `admin_document_proof`

**Bank-transfer withdrawal only** (this is how withdrawals enter the vendor portal):

- Creates `VendorTransfer` (`status=assigned`)
- Sets `assigned_to` from `payment_method.vendor_user_id` when connected
- Sets PR `approval_status=processing` (funds stay debited)
- Message: `"Payment request sent to vendor for processing"`

Other gateways still go straight to `approved` (no vendor row).

**Success `200` (bank transfer)**

```json
{
  "status": "success",
  "message": "Payment request sent to vendor for processing",
  "data": {
    "id": 455,
    "approval_status": "processing",
    "payment_status": "paid"
  }
}
```

**Note:** Bank-transfer deposits with `vendor_user_id` are already in the vendor queue on create; admin approve is for amount-adjusted deposits / admin-only deposits, not the normal vendor deposit path.
---

### C2. Reject payment request

`POST /admin/payment-requests/reject/<req_id>`  
Permission: `payment_requests.reject`

Works for:

- `pending` bank-transfer withdrawals
- `processing` bank-transfer withdrawals (cancels vendor row + reverses funds)

---

### C3. Adjust amount (related ops)

`PATCH /admin/payment-requests/<req_id>/amount`  
Permission: `payment_requests.approve`  
Adjust INR/USD on **pending** bank-transfer PR (before vendor).

---

## D. Upstream create withdrawal (not vendor UI)

These create the `PaymentRequest` that later becomes a vendor job after admin approve.

### D1. Withdrawal OTP (example: IB)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/ib/wallet/withdraw/request` | Request OTP (stores OTP in Redis) |
| `PUT` | `/ib/wallet/withdraw/verify` | Verify OTP |

Same pattern exists for client and FM:

- `/client/wallet/withdraw/request` · `/client/wallet/withdraw/verify`
- `/fm/wallet/withdraw/request` · `/fm/wallet/withdraw/verify`

---

### D2. Create bank-transfer withdrawal

| Audience | Method | Path |
|----------|--------|------|
| Client | `POST` | `/client/wallet/create-bank-transfer-withdrawal` |
| FM | `POST` | `/fm/wallet/create-bank-transfer-withdrawal` |
| IB | `POST` | `/ib/wallet/create-bank-transfer-withdrawal` |

**Typical body**

```json
{
  "trading_account_id": 1039,
  "payment_method_id": 58,
  "amount": 25,
  "payment_method_code": "bank_transfer",
  "currency": "INR",
  "user_bank_account_id": 2
}
```

Notes:

- Client path usually needs `trading_account_id`.
- FM / IB paths debit commission / IB wallet (no trading account required for IB wallet flow).
- Amount is debited on create; PR starts `pending` / `paid`.
- **No vendor row on create** — even when the method has `vendor_user_id`. Admin must first-approve (C1) before the job appears in the vendor portal.
- Payout currency for bank transfer is **INR**.

Also related:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `…/payment-methods?type=withdrawal` | List methods (client / fm / ib) |
| `GET` | `/client/payment-requests?type=withdrawal` | Client history — `pending` = awaiting admin; `processing` = with vendor |

---

## E. API map (frontend → backend)

What this frontend calls today (`src/api/urls.js`):

| UI action | Method | Path under `/admin` |
|-----------|--------|---------------------|
| Login | `POST` | `/login` |
| Profile | `GET` | `/profile` |
| Queue list | `GET` | `/vendor/transfers` |
| Save draft | `PATCH` | `/vendor/transfers/:id` |
| Complete | `POST` | `/vendor/transfers/:id/submit` |
| Reject | `POST` | `/vendor/transfers/:id/reject` |

Declared in `urls.js` but **unused** in this app: `admins`, `wallet`, `plans`, `paymentRequests`.

---

## F. Code locations

| Piece | Path |
|-------|------|
| Vendor routes | Backend `app/payments/vendor/routes.py` |
| Vendor service | Backend `app/payments/vendor/service.py` |
| Vendor model | Backend `app/payments/vendor/models.py` (`VendorTransfer`) |
| Constants / proof limits | Backend `app/payments/vendor/constants.py` |
| RBAC seed | Backend `app/payments/vendor/schema.py` |
| First-approve hook | Backend `app/routes/admin_payment_request.py` |
| Bank-transfer create | Backend `app/payments/bank_transfer/` |
| Vendor Queue UI | `src/pages/dashboard/VendorTransfers.vue` |
| API client | `src/api/request.js`, `urls.js` |

Backend companion: backend `docs/vendor/`
