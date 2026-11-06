# Isolated real Statybos24 test site — preparation status

Requested source: `fix/job-ad-delete-retire-close-20261105`, commit `c41d3802e516d11955f7a4f8134c6a473ceb4511`.
Implementation branch: `feat/isolated-real-e2e-20261106`.

**Not deployed / NO-GO until the staging backend audit and credentials are complete.**
No production database, production Worker, Stripe, Access policy or main-site configuration was changed.

## Exact separate targets

- Worker: `statybos24-e2e-test`; intended address: `https://statybos24-e2e-test.4floss.workers.dev` (not yet a working site).
- Database: only the existing staging project `wpldojonwvccdmpmlbfe`. Repository documents report a prepared schema and seeded records; these claims have NOT been verified in this session.
- Only three confirmed staging identities are accepted, server-side: `4floss@gmail.com`, `tattoo.staponas@gmail.com`, `beatabune@gmail.com`.
- Each staging identity must have the intended independent `admin`, `employer`, `worker` role and working test credentials. Production passwords and sessions are not copied.
- Real `App`, `WorkerDashboard`, `EmployerDashboard`, `AdminDashboard` components run with `VITE_E2E_REAL_ACCOUNTS=true`; `QaSandbox` simulation is bypassed.

## Implemented protection

`e2e/worker.mjs` is a distinct entrypoint, never `worker.js`.
It returns 503 unless a backend safety audit has explicitly been completed and its staging public key configured.
Unauthenticated assets and pages redirect to the separate login gate; a valid staging session and confirmed allowlisted email are checked before returning application assets.
Cookies are Secure, HttpOnly, SameSite=Strict. Writes require the exact same origin.
The login gate uses ONLY staging Auth. Registration, password-recovery emails, invitations and arbitrary Edge Functions are blocked.
HTTP DB/Storage and realtime traffic are confined to the same protected site and fixed staging project.
Sentry, analytics submission, push-worker registration, Stripe/checkout and outbound Edge Functions are disabled. CSP disallows browser connections to production and third-party integrations.
A revoked/non-allowlisted session is denied even if a client fakes its role or bearer header.

## Backend audit still required

Browser protection alone DOES NOT disable SQL triggers, cron or backend dispatchers in the staging database.
Before enabling `E2E_SAFETY_VERIFIED`, inspect the real staging schema, active jobs, trigger/function outbound network calls, SMTP/SMS configuration, Storage, and Edge Functions.
Disable or replace staging-only external dispatchers; keep internal notifications/chat database changes working.
Verify no production URLs or live integration secrets are used by any callable staging backend operation.
The read-only script `scripts/inspect-e2e-backend.mjs` lists candidate problems without printing secrets. It never queries production and never approves itself.
Edge operations, including CV deletion and admin impersonation, remain blocked until a staging-only implementation has been separately audited. Thus full functional E2E is NOT yet claimed.

## Credential blocker and environment draft

Current environment has Cloudflare API access only; no Supabase management credential or staging connection is ready.
A saved environment draft adds:

- Secret requirement `SUPABASE_TEST_MANAGEMENT_TOKEN`, restricted to `api.supabase.com`.
- Network domains `api.supabase.com`, `wpldojonwvccdmpmlbfe.supabase.co`, `statybos24-e2e-test.4floss.workers.dev`; previous allowed domains are preserved.

The owner must enter a Supabase account access token in the environment secret field, save, and Publish the environment. Never paste credentials in chat.
Saving a draft did NOT activate these settings.

After activation, run `NODE_USE_ENV_PROXY=1 node scripts/inspect-e2e-backend.mjs`.
Obtain the verified staging publishable key through the management API; never place service-role/secret keys in VITE variables.
Confirm all three staging accounts and all backend side effects before constructing the audit artifact.

## Deployment gate

`node scripts/build-e2e.mjs` rejects production URLs and private keys; outputs ONLY `dist-e2e`.
`node scripts/deploy-e2e.mjs` requires a fresh reviewed audit artifact (`E2E_BACKEND_AUDIT_FILE`) containing:

- `project: "wpldojonwvccdmpmlbfe"`, `ready_to_open: true`, `outbound_disabled: true`, `verified_at` within six hours;
- exactly three `accounts_verified` entries (`email`, `role`), covering the allowlist and all three roles;
- `publishable_key_sha256` of the actual verified staging publishable key.

It rejects production Worker names, alternative entrypoints, routes, environments and stale/unverified audits.
Do not bypass this gate with a bare deploy command. The isolated Worker checks its exact hostname as well.
After deployment verify unauthenticated access, the three accounts, fourth-account denial, role-to-role actions, no outbound sends, and unchanged main-site version.

## Completed local checks

- 15 automated security/build-guard checks passed. Automated server-gate checks: allowlist, confirmation, auth cookie, CSRF, production-host rejection, backend path restrictions, encoded traversal, forbidden payments/emails, staging-only DB and realtime.
- Real dashboards rendered at 1440/390 px for worker/employer/admin using explicit mock data. These checks are not real Supabase logins.
- Isolated production build with a clearly synthetic public-key placeholder. That artifact is NOT approved for deployment.

Still untested: live staging authentication, schema parity, SQL side effects, role-to-role writes, real Storage/CV deletion, live messages and deployment.
