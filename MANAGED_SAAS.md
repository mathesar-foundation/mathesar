# Managed-SaaS Deployment

Mathesar can be deployed in two distinct modes: **self-hosted** (the
default; operators run their own instance) and **managed-SaaS** (the
multi-tenant cloud operated by the Mathesar Foundation). Most readers
of this repository will only ever care about self-hosted; this
document is for operators of the managed-SaaS deployment.

The deployment mode is selected at startup via the
`MATHESAR_DEPLOYMENT_TYPE` environment variable. Allowed values:

| Value          | Meaning                                  |
| -------------- | ---------------------------------------- |
| `SELF_HOSTED`  | Default. Operator runs the instance.     |
| `MANAGED_SAAS` | Multi-tenant cloud operated by Mathesar. |

The two modes have substantively different authentication,
authorization, and provisioning behavior. **The self-hosted mode is
unaffected by anything in this document.**

## What changes in managed-SaaS mode

### Authentication is SSO-only

Sign-in is via Google or GitHub OAuth only. Username/password forms
are removed from the login UI. The local password column on
`User` is preserved (for `createsuperuser` bootstrap — see below) but
is not exposed by any user-facing route in this mode.

### The `complete_installation` bootstrap form is disabled

The self-hosted bootstrap flow (a one-time form that creates the
first superuser via username/password) is bypassed in managed-SaaS.
The `/complete_installation/` URL is not registered. The system
tolerates a managed-SaaS instance running with zero superusers — end
users sign up freely via SSO.

### User-management RPCs are partially gated

The following RPC endpoints **refuse calls** in managed-SaaS mode and
return `OperationNotSupportedInManagedSaas` (error code `-28038`):

- `users.add` — sign-up is SSO-only; admins do not create local users.
- `users.password.replace_own` — SSO users have no local password.
- `users.password.revoke` — same.

`users.list`, `users.get`, `users.patch_self`, `users.patch_other`
(including the `is_superuser` toggle), and `users.delete` remain
fully available so admins can manage existing SSO-signed-up users.
The web UI hides the corresponding controls (Add User button,
password change forms) when running in managed-SaaS mode.

### `User.email` is required at the flow layer, not the model layer

Mathesar's `User.email` field remains optional at the model layer
(`blank=True`) — this is unchanged from self-hosted, where admins
sometimes create local users without email addresses. In
managed-SaaS, the SSO adapter rejects any sign-up that doesn't carry
a verified email from the provider, so in practice every
managed-SaaS user has an email. Do not "fix" the model's `blank=True`
— it is load-bearing for self-hosted.

### `/admin/` access is the deployment infrastructure's responsibility

Django's built-in admin (`/admin/`) accepts username/password and
remains registered in managed-SaaS. **This URL must not be reachable
from the public internet.** The deployment's reverse proxy / ingress
/ firewall is required to restrict `/admin/*` to internal traffic
(VPN, bastion, internal subnet). The application does not enforce
this on its own.

## Required environment variables

The following must be set when `MATHESAR_DEPLOYMENT_TYPE=MANAGED_SAAS`.
Missing values fail loudly at startup with `ImproperlyConfigured`.

| Variable                  | Description                          |
| ------------------------- | ------------------------------------ |
| `GOOGLE_OAUTH_CLIENT_ID`  | Google OAuth 2.0 client ID.          |
| `GOOGLE_OAUTH_SECRET`     | Google OAuth 2.0 client secret.      |
| `GITHUB_OAUTH_CLIENT_ID`  | GitHub OAuth App client ID.          |
| `GITHUB_OAUTH_SECRET`     | GitHub OAuth App client secret.      |

Each environment (prod, staging, dev) should have its own OAuth app
registered with the provider, with the appropriate redirect URI
(`https://<host>/auth/google/login/callback/` and
`https://<host>/auth/github/login/callback/`). Do not share OAuth
credentials across environments.

The `sso.yml` file and `OIDC_CONFIG_DICT` env var (used by self-hosted
for OIDC configuration) are ignored in managed-SaaS mode.

## Bootstrap admin recipe

Managed-SaaS does not have an in-app form for creating the first
admin. The recipe is:

1. **Run `createsuperuser`** on a running instance:

    ```sh
    python manage.py createsuperuser
    ```

    Provide the username, email (this *must* match the email on the
    Google or GitHub account that will be used to log in), and a
    throwaway password. The password is never used again.

2. **Sign in via SSO** at `/auth/login/` using Google or GitHub with
   the same email address. allauth's auto-link-by-email behavior
   connects the social account to the existing superuser row, and
   the operator is now signed in as admin.

The throwaway local password remains on the user row but is unreachable
through any public surface (since the login form is SSO-only). It would
only be usable via `/admin/`, which is restricted at the network layer
per the section above.

## OAuth secret rotation

Both Google and GitHub support overlapping active OAuth client
secrets, with slightly different ergonomics. The rotation procedure:

1. Generate a new client secret in the provider's developer console.
2. Deploy the new secret as the `*_OAUTH_SECRET` env var. A rolling
   restart suffices — both the old and new secrets are accepted by
   the provider during the overlap window, so in-flight auth flows
   complete normally.
3. Once all instances are on the new secret, delete the old secret in
   the provider's console.

Per-user OAuth tokens are not stored
(`SOCIALACCOUNT_STORE_TOKENS = False`), so a database leak does not
expose user-side tokens.
