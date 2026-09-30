# Vendor — end-to-end flow

```text
Admin: bank_transfer method → vendor_user_id = staff

Deposit
  → User creates → PR processing + VendorTransfer assigned
  → Vendor sees job immediately
  → Confirm (UTR optional if user already sent) → credit
  → Or change amount → awaiting admin → admin approve → credit

Withdrawal (admin-first)
  → User creates → PR pending (admin queue only; not in vendor portal yet)
  → Admin approve → VendorTransfer assigned + PR processing
  → Vendor Complete with UTR/proof → done

Reject (reason required): cancels job; reverses funds only for withdrawals
```

## Dual path

| Type | `vendor_user_id` set? | Behaviour |
|------|----------------------|-----------|
| Deposit | Yes | Job appears in vendor portal as `processing` on create |
| Deposit | No | Admin-only approve (no vendor row) |
| Withdrawal | Yes or No | Stays `pending` until admin approve; then vendor portal |
