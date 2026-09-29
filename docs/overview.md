# Vendor — overview

## What it is

Vendor portal for **bank-transfer deposits and withdrawals**. Each bank-transfer payment method can have a connected staff (`vendor_user_id`). When a user submits a request on that method, the job appears in that staff’s queue.

## Who does what

| Actor | Job |
|-------|-----|
| Admin | Sets `vendor_user_id` on bank-transfer payment methods |
| User | Creates bank-transfer deposit/withdrawal |
| Vendor (this app) | Confirms deposits / pays withdrawals, then complete or reject |

Login: `POST /admin/login` (staff + RBAC role **Vendor**).

## Main screen

`/vendor/transfers` — filters by status and type (deposit / withdrawal). List is scoped to the logged-in staff’s `assigned_to` jobs.

## API base

Axios base `{host}/admin/`. Production usually same-origin or admin host; Dev Login can override via `localStorage.custom_base_url`.
