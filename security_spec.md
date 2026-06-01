# Security Specification for Master Management

## Data Invariants
- An Invoice cannot exist without a valid creator UID (cashierName/userId).
- Invoices are private to the organization (all authenticated users can read, but only admins can delete).
- Company settings can only be modified by admins.
- Apps, Panels, Decoders are shared resources readable by all authenticated users, but modifiable only by authorized personnel (admins/resellers).

## The "Dirty Dozen" Payloads
1. **Invoice Hijack**: Attempt to create an invoice with a future timestamp. (Status: Should be REJECTED)
2. **Ghost Field Update**: Attempt to update an invoice with an extra non-schema field `is_deleted: true`. (Status: Should be REJECTED)
3. **Identity Spoofing**: Attempt to create an invoice with `cashierName` set to someone else. (Status: Should be REJECTED)
4. **Settings Overwrite**: A non-admin user trying to change the bank account number in global settings. (Status: Should be REJECTED)
5. **PII Leak**: Attempting to read users collection without being authenticated. (Status: Should be REJECTED)
6. **Price Tampering**: Updating an invoice and changing the `amount` field. (Status: Only Admins can change amount once created)
7. **Invalid ID**: Creating a document with a 2KB string as ID. (Status: Should be REJECTED)
8. **Negative Amount**: Creating an invoice with `amount: -500`. (Status: Should be REJECTED)
9. **Role Escalation**: A user trying to update their own document in `users` to `role: 'admin'`. (Status: Should be REJECTED)
10. **Terminal State Break**: Trying to change a 'paid' invoice back to 'pending'. (Status: Should be REJECTED)
11. **Mass Selection**: Trying to 'list' all invoices without a limit or being authenticated. (Status: Should be REJECTED)
12. **orphaned Record**: Creating a Panel without a valid reference to a region. (Status: Should be REJECTED)

## Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|------------------|-------------------|-------------------|
| invoices   | Prevented (UID check) | Prevented (Transition logic) | Prevented (Size limits) |
| settings   | Prevented (Admin check) | N/A | Prevented (Size limits) |
| apps       | Prevented (Role check) | N/A | Prevented (Size limits) |
