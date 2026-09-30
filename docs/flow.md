# Vendor — end-to-end flow

```text
Admin: bank_transfer method → vendor_user_id = staff

User deposit or withdrawal
  → PR processing + VendorTransfer assigned
  → Admin and vendor both see processing

Deposit (amount unchanged): Confirm → credit (vendor UTR optional if user already sent UTR/proof)
Deposit (amount changed): Save amount → awaiting admin → admin approve → credit
Withdrawal: Complete with UTR/proof → done

Reject: cancels job; reverses funds only for withdrawals
```

## Dual path

| Method has `vendor_user_id`? | Behaviour |
|------------------------------|-----------|
| Yes | Job appears immediately as `processing` |
| No | Withdrawals need admin first-approve; deposits stay admin-only |
