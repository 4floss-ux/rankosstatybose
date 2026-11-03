# Hire company messages (not deployed)

Branch: `feat/hire-company-messages`. Existing uncommitted files preserved.

The administrator's company request and the employer portal share a text-only
conversation section using existing card, field and button styles. No attachments,
email notifications, read receipts or changes to existing recruitment workflows.
Latest 100 messages, manual refresh and refresh every 30 seconds while visible.
Failed sends retain the draft and retry ID. Text is rendered as React text, not HTML.
Employer controls use Lithuanian or English; other portal languages fall back to
English for this new section only.

## Server review required before deployment

`docs/sql-review/20261103160000_hire_messages_REVIEW.sql` is a proposed transaction,
not an applied migration. In particular, the reviewer must confirm the real session
revocation column (`revoked_at`) and compare the authorization with the existing
`app_private.foreign_employer_session_account` helper. Prefer that existing helper
after its actual return type/contract are confirmed. Do not apply an assumed schema.

The proposed implementation checks active administrator role on every admin RPC;
employer RPCs derive the request from a hashed, unexpired, unrevoked session and
active account with the first-password change completed. Table access is revoked
from browser roles and protected by RLS. No realtime publication. Sender identities
and timestamps come from the server. Retry IDs are unique within a request and
must match the original author and content. Raw session tokens are not stored in
the message table. This is a new table; existing records are not rewritten.

## Required real integration checks (not executed)

Use synthetic requests/accounts only after separate database approval:
administrator sends, company reads/replies, administrator reads reply; two-company
isolation including forged request/author IDs; ordinary/inactive administrator
denial; expired/revoked session and inactive account denial; mandatory first-password
change; network retry idempotency; markup stays plain text; 1440/390px layouts.
Review triggers and table dependencies before applying. No deployment, migrations,
payments, customer-data changes or real messages have been executed by this work.

## Local results

- Main and independent hire production builds: PASS (existing main bundle-size warning).
- Message request/validation tests: 4 PASS.
- Synthetic browser checks at 1440px and 390px: PASS (rendering, text escaping,
  empty-send prevention, failed-send draft preservation, retry identity and
  employer RPC context). These do not prove database authorization.
- Existing administrator-session checks: 18 PASS, using the required
  `--experimental-vm-modules` flag. Initial run without that flag failed to load
  the test fixture; no product-code regression was identified.
- Existing company-code and hire-route checks: PASS.
