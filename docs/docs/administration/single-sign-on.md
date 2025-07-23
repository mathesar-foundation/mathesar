# Single Sign-on (SSO)

This guide walks you through how to configure Single Sign-On (SSO) for Mathesar.

SSO allows users to log into your Mathesar instance without the need to create or manage separate accounts.


This guide is intended for IT admins or developers who are configuring secure access to Mathesar.

### 1. Setting up your identity provider

First, configure your identity provider (IdP) to work with Mathesar.

???+ tip "How SSO support in Mathesar works"
    Mathesar supports any identity provider that implements the [OpenID Connect (OIDC) standard](https://openid.net/developers/how-connect-works/), such as Okta, Azure Active Directory, Google Workspace, and others.

Although all supported IdPs follow the same specification, they each have a different user interfaces and process for setting up an application.

Here are several popular identity providers that should work with Mathesar's OIDC SSO implementation. Where possible, we've linked to relevant documentation about configuring each provider.

| Provider      | Key           |
|---------------|---------------|
| [Apple](https://support.apple.com/guide/apple-business-manager/federated-authentication-identity-provider-axmfcab66783/web)         | `apple`       |
| [Auth0](https://auth0.com/docs/get-started/auth0-overview/create-applications)         | `auth0`       |
| [GitLab](https://docs.gitlab.com/integration/openid_connect_provider/)        | `gitlab`      |
| [Google](https://support.google.com/a/answer/12032922#OIDC_setup)        | `google`      |
| [Kakao](https://developers.kakao.com/docs/latest/en/kakaologin/utilize#oidc)         | `kakao`       |
| [Keycloak](https://www.keycloak.org/securing-apps/oidc-layers)      | `keycloak`    |
| [LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)      | `linkedin`    |
| [Microsoft](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)     | `microsoft`   |
| [Okta](https://developer.okta.com/docs/guides/sign-into-web-app-redirect/asp-net-core-3/main/#create-an-app-integration-in-the-admin-console)          | `okta`        |

Whichever provider you're using, you'll begin by creating an application.

During creation, you'll need to provide the "Callback URL"—also referred to as the Redirect URI or Login URL, depending on the provider. The callback URL tells your identity provider where to send users after they’ve successfully logged in, so they can be redirected back to Mathesar.

!!!info "Configuring the callback URL"
    In your provider's settings, set the Callback URL to:

    ```
    https://<mathesar-domain>/auth/oidc/<provider-name>/login/callback/
    ```

    Replace `<mathesar-domain>` with the domain name of your Mathesar installation.<br>
    Examples: `mathesar.myorg.com`, `localhost:8000`

    Replace `<provider-name>` with the name of your IdP provider.<br>
    Examples: `auth0`, `okta`, `google`

Your identity provider will redirect users to this URL after authentication, so it's essential that it matches exactly between your IdP configuration and your Mathesar setup.

Once your IdP is fully configured, you're ready to move on to the next step: populating your `sso.yml` file with the necessary values from your identity provider.

### 2. Enabling SSO in Mathesar

SSO in Mathesar is configured outside of the application interface, using a straightforward configuration file. To enable SSO in Mathesar, start by creating a configuration file called `sso.yml`.

!!!info "Using the OIDC_CONFIG_DICT environment variable instead of sso.yml"
    If you're unable to write to the local filesystem, like when using a cloud provider with an ephemeral filesystem or for other purposes, you can also configure SSO in Mathesar by creating a `OIDC_CONFIG_DICT` environment variable which is a stringified JSON object.

    You'll want to convert the YAML configuration in sso.yml, then stringify the JSON. Here's an example of the final result:

    ```env
    OIDC_CONFIG_DICT="{\"version\": 1,\"oidc_providers\": {\"provider1\": {\"provider_name\": \"okta\",\"client_id\": \"client-id\",\"secret\": \"client-secret\",\"server_url\": \"https://trial-2872264-admin.okta.com\"}}}"
    ```

    For docker installations, you'll also need to add the `OIDC_CONFIG_DICT` variable to the

Instructions for where to save the file vary slightly, depending on which installation method you've used:

=== "For Docker Compose installations"

    For [docker compose](./install-via-docker-compose.md) installations, create a `sso.yml` file next to your [`docker-compose.yml` file](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml).:

    ```diff
    mathesar
     ├── docker-compose.yml
     ├── msar/
    +└── sso.yml
    ```

    Then, uncomment the following lines in your docker compose file:

    ```diff
     volumes:
       - ./msar/static:/code/static
       - ./msar/media:/code/media
     # Uncomment the following to mount sso.yml and enable Single Sign-On (SSO).
    -# - ./sso.yml:/code/sso.yml
    +  - ./sso.yml:/code/sso.yml
    ```

=== "For Linux, macOS, or WSL installations"

    For [non-Docker installations](./install-from-scratch.md), you'll need to create the `sso.yml` file in the installation directory you [defined while installing](./install-from-scratch.md#set-up-your-installation-directory) Mathesar.

Once the file is created, you paste in our [example configuration](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/sso.yml.example). You'll edit this configuration in the following steps to work with your provider.

### 3. Configuring the identity provider in Mathesar

Now that your identity provider (IdP) is configured and you've created the `sso.yml` file, the next step is to tell Mathesar about your provider by adding it to the `sso.yml` file.

We'll use **Okta** as the example provider, but the same structure applies to others like Auth0, Google, or Azure AD.

#### Naming Your Provider

Each provider is defined under a unique key (e.g., `provider1`). Inside that block, you must specify the `provider_name`, which is a lowercase, alphanumeric identifier for the IdP. It should match the value you used in the callback URL.

Examples: `okta`, `auth0`, or `google`.

You must also specify the `server_url`: the issuer URL or OIDC discovery URL provided by your IdP. This is the base URL that Mathesar uses to fetch OIDC metadata (including token endpoints, authorization endpoints, and keys).

- In Okta, it looks like:
`https://your-org.okta.com`
- In Auth0, it might be:
`https://your-tenant.auth0.com`
- In Google, it’s typically a fixed value:
`https://accounts.google.com`

Refer to your IdP’s documentation for the correct issuer or discovery URL.

Now, we should have all the information necessary to add our first provider to `sso.yml`:

```diff
# This config file allows you to configure OpenID Connect(OIDC)
# based Single Sign-On(SSO) for logging into Mathesar with your preferred
# Identity Provider(IdP).
version: 1
oidc_providers:
+  provider1:
+    provider_name: okta
+    server_url: https://your-org.okta.com
```

Next, retrieve the following values from your IdP’s admin interface:

- `client_id`
- `secret` (sometimes called `client secret`, `token`, or `client key`)

These credentials authenticate Mathesar with your IdP.

Add them to the provider block like so:

```diff
  provider1:
    provider_name: okta
    server_url: https://trial-example-admin.okta.com
+   client_id: client-id
+   secret: client-secret
```

You've now completed all the minimum requirements to enable Single Sign-On (SSO) in Mathesar. Next, you can:

- Add additional providers, if needed, by repeating this process
- Explore optional but **recommended** settings like [restricting access to particular email domains](#restrict-access-to-specific-email-domains) and [setting default database roles](#set-default-user-roles-for-your-databases)

Finally, you'll need to restart Mathesar so it can read the `sso.yml` file and enable your changes. Be sure to  use the correct method for your installation:

=== "For Docker Compose installations"

    ```bash
    docker compose -f docker-compose.yml down
    docker compose -f docker-compose.yml up -d
    ```

=== "For Linux, macOS, or WSL installations"

    ```bash
    sudo systemctl restart mathesar.service
    ```

These options can help you tailor authentication and access control to better fit your organization's needs.

![Sign into Mathesar with Okta](../assets/images/sso-login-page-okta.png)

## Additional configuration options

You can extend the providers in your `sso.yml` file with additional settings to restrict access and define default roles for users. These fields are optional, but **highly recommended** for tightening security and streamlining user provisioning.

### Restrict access to specific email domains

Use the `allowed_email_domains` setting to restrict SSO logins to specific email domains. This is useful if your identity provider manages multiple domains or if you want to prevent unauthorized domains from accessing your Mathesar instance.

- **Default:** No restriction (i.e., users from any domain can log in).
- **Expected format:** A list of domain names (e.g., `['example.com', 'mathesar.org']`).

**Example:**

```diff
oidc_providers:
  provider1:
    provider_name: okta
    server_url: https://trial-example-admin.okta.com
    client_id: YOUR_CLIENT_ID
    secret: YOUR_SECRET
+   allowed_email_domains: ['example.com', 'mathesar.org']
```

With this configuration, only users whose email ends in `@example.com` or `@mathesar.org` will be allowed to log in.

---

### Set default user roles for your databases

The `default_pg_role` block allows you to **automatically assign PostgreSQL roles** to users the first time they log in via SSO. You can configure this for one or more databases.

Each database block must include the following:

- `name`: The **PostgreSQL database name**
- `host`: The **hostname** or IP address of the database
- `port`: The **port** on which the database is running
- `role`: The **PostgreSQL role** to assign to users

**Example:**

```diff
oidc_providers:
  provider1:
    provider_name: okta
    server_url: https://trial-example-admin.okta.com
    client_id: YOUR_CLIENT_ID
    secret: YOUR_SECRET
+   default_pg_role:
+     db1:
+       name: my_database
+       host: db.internal.example.com
+       port: 5432
+       role: readonly_user
+     db2:
+       name: analytics_db
+       host: analytics-db.example.net
+       port: 5432
+       role: analyst
```

On first login, users will be granted the specified roles on each listed database. This simplifies onboarding and ensures consistent access control across your environment.

## Disabling Single Sign-On

To disable SSO in Mathesar, delete the `sso.yml` file from your installation directory and restart the application. This will revert Mathesar to using only email and password-based authentication.

!!!warning "Resetting user passwords"
    Users who were originally created via SSO do not have a known password—they are automatically assigned a random, system-generated one during account creation. As a result, these users will not be able to log in after SSO is disabled unless their passwords are reset.

    To restore access for these users:

    1. Have an administrator reset each user’s password through the Mathesar user interface.
    2. When the user logs in with the administrator-supplied password, they will be prompted to create a new personal password.

    We recommend completing all necessary password resets before disabling SSO to ensure a smooth transition and avoid user lockouts.
