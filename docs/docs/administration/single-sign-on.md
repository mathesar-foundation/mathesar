# Single Sign-on (SSO)

!!! question "Help us refine SSO!"
	Our SSO feature is new and potentially rough around the edges. We would love to talk with you about what you're using it for, whether it's working for you, and any additional workflows you'd like us to support. If you [talk to us for 20 min](https://cal.com/mathesar/users), we'll give you a $25 gift card as a thank you!

Mathesar supports single sign-on (SSO) using any identity provider that implements the [OpenID Connect (OIDC) standard](https://openid.net/developers/how-connect-works/), such as Okta, Azure Active Directory, Google Workspace, and others. SSO allows users to use Mathesar without needing to maintain another set of credentials.

**Configuring SSO is optional**. By default, Mathesar has separate user accounts with their own passwords, as described in [Mathesar Users](../user-guide/users.md).

## Setting up SSO

Assuming you already have an identity provider (IdP) set up, this guide explains how to set up SSO in Mathesar using that provider.

### 1. Configure your identity provider (IdP)

First, you'll need to set up your IdP to be aware of Mathesar.

#### 1a. Identify your IdP key

We support over a hundred IdPs ([see the full list](https://docs.allauth.org/en/latest/socialaccount/providers/index.html)). You'll need our "key" associated with it to configure your application's callback URL in your IdP.

Here's a list of common IdPs, with links to their documentation, and the key associated with each.

| Provider | Key | Provider | Key | Provider | Key |
|---|---|---|---|---|---|
| [Apple](https://support.apple.com/guide/apple-business-manager/federated-authentication-identity-provider-axmfcab66783/web) | `apple` | [Google](https://support.google.com/a/answer/12032922#OIDC_setup) | `google` | [LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2) | `linkedin` |
| [Auth0](https://auth0.com/docs/get-started/auth0-overview/create-applications) | `auth0` | [Kakao](https://developers.kakao.com/docs/latest/en/kakaologin/utilize#oidc) | `kakao` | [Microsoft](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc) | `microsoft` |
| [GitLab](https://docs.gitlab.com/integration/openid_connect_provider/) | `gitlab` | [Keycloak](https://www.keycloak.org/securing-apps/oidc-layers) | `keycloak` | [Okta](https://developer.okta.com/docs/guides/sign-into-web-app-redirect/asp-net-core-3/main/#create-an-app-integration-in-the-admin-console) | `okta` |

If you would like to use a different provider, find your IdP on [this list](https://docs.allauth.org/en/latest/socialaccount/providers/index.html) and navigate to its page. The key is the part of the "development callback URL" between `accounts/` and `/login`.

#### 1b. Create the Mathesar application in your IdP

Create an OAuth application within your IdP using the process you usually follow.

During this process, you'll be asked to specify a "Callback URL" (also called a Redirect URI or Login URL, depending on the provider). This is the URL your IdP uses to return users to Mathesar after a successful login.

In your provider's settings, set the Callback URL to:

```
https://[YOUR MATHESAR DOMAIN]/auth/oidc/[IDP KEY FROM 1a]/login/callback/
```

!!! warning ""
	Ensure you replace the two variables in the example URL above. Your SSO configuration will not work unless this URL is an exact match.

### 2. Enable SSO in Mathesar

Enabling SSO in Mathesar requires setting up a new configuration file or environment variable to hold the necessary IdP-related settings. 

#### 2a. Create configuration file.

You'll either create a file named `sso.yml` or set up the `OIDC_CONFIG_DICT` environmental variable. Which you create, and where you save it depends on how you installed Mathesar:

=== "Docker Compose"

    If you used [Docker Compose](./install-via-docker-compose.md), create the `sso.yml` file next to your [`docker-compose.yml` file](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml):

    ```diff
    mathesar
     ├── docker-compose.yml
     ├── msar/
    +└── sso.yml
    ```

    Then uncomment the following lines in your docker compose file:

    ```diff
     volumes:
       - ./msar/static:/code/static
       - ./msar/media:/code/media
     # Uncomment the following to mount sso.yml and enable Single Sign-On (SSO).
    -# - ./sso.yml:/code/sso.yml
    +  - ./sso.yml:/code/sso.yml
    ```

=== "Directly on Linux, macOS, or WSL"

    For [direct installations](./install-from-scratch.md), create `sso.yml` in the installation directory you [defined while installing](./install-from-scratch.md#set-up-your-installation-directory) Mathesar.

=== "Other install methods"

	If you deployed to an environment where you can't use the local filesystem (e.g. [DigitalOcean](./install-digitalocean.md), [Railway](./install-railway.md)), you can use the `OIDC_CONFIG_DICT` environment variable instead of an `sso.yml` file.

	This variable must contain a JSON representation of the same data that `sso.yml` contains, wrapped in quotes and with quotes escaped. Here's an example:
	
    ```env
    OIDC_CONFIG_DICT="{\"version\": 1,\"oidc_providers\": {\"provider1\": {\"provider_name\": \"okta\",\"client_id\": \"client-id\",\"secret\": \"client-secret\",\"server_url\": \"https://trial-2872264-admin.okta.com\"}}}"
    ```
	!!! tip "See [Environment Variables](./environment-variables.md#oidc_config_dict-optional) for links to tools that simplify this process."

#### 2b. Start with our sample configuration

Once you have `sso.yml` created, paste in our [example configuration](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/sso.yml.example).

If you're using `OIDC_CONFIG_DICT` instead, we recommend starting with a YAML file and filling in the configuration before converting it to JSON.


### 3. Configuring your IdP in Mathesar

Here's where you populate the configuration file.

#### 3a. Retrieve needed information

You'll need the following information handy for this step:

- The key associated with your IdP, from Step 1a.
- OIDC issuer or discovery URL, from your IdP's documentation (e.g. `https://[YOUR-ORGANIZATION].okta.com` for Okta)
- The client ID and secret for the Mathesar OAuth application you set up in Step 1b. The secret may instead be called "client secret", "token", or "client key".

#### 3b. Basic setup

Once you have those, update `sso.yml` like so:

```diff
# This config file allows you to configure OpenID Connect(OIDC)
# based Single Sign-On(SSO) for logging into Mathesar with your preferred
# Identity Provider(IdP).
version: 1
oidc_providers:
+  [provider1]:
+    provider_name: [PROVIDER KEY]
+    server_url: [YOUR SERVER URL]
+ 	 client_id: [YOUR CLIENT ID]
+	 secret: [YOUR CLIENT SECRET]
```

!!! tip "Skip straight to [Step 7](#7-activate-sso) if you don't need to configure restricted email domains, default Postgres roles, or additional providers."

### 4. (Optional) Restrict to specific email domains

By default, users from any domain can log in to Mathesar, as long as they are registered with the IdP. You can change this to only allow users to log in if their domain of their email address is on a list of specific allowed domains.

You can use the `allowed_email_domains` setting to achieve this. It expects a list of domain names (e.g., `['example.com', 'mathesar.org']`), like so:

```diff
oidc_providers:
  provider1:
    provider_name: okta
    server_url: https://trial-example-admin.okta.com
    client_id: YOUR_CLIENT_ID
    secret: YOUR_SECRET
+   allowed_email_domains: ['example.com', 'mathesar.org']
```

Now, only users whose email ends in `@example.com` or `@mathesar.org` will be allowed to log in.

### 5. (Optional) Automatically provision new users with a specific role

By default, administrators need to [manually assign](,,/user-guide/collaborators.md) [PostgreSQL roles](../user-guide/stored-roles.md) for each individual user, per database. 

The `default_pg_role` block simplifies this process by allowing you to configure a specific PostgreSQL role to automatically assign the user the first time they log in via SSO. This must be configured per-database, as follows:

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

Each database block must include the following:

- `name`: The **PostgreSQL database name**
- `host`: The **hostname** or IP address of the database
- `port`: The **port** on which the database is running
- `role`: The **PostgreSQL role** to assign to users

On first login, users will be granted the specified roles on each listed database. This only works for new users; existing users will have their roles preserved.

!!! tip "Overriding automatic provisioning"
	Since Mathesar preserves roles associated with existing users, administrators can take advantage of this and pre-create user accounts that they want to assign a different role to, and assign roles via the Mathesar UI. Then, when the user logs in for the first time, they'll have the custom role that was assigned to them.
	
	??? example "Example scenario"
		Acme, Inc. is setting up SSO and wants employees to have read-only access by default, except for the CTO and support engineers.
		
		During the process of setting up Mathesar, they:
		
		1. create 'read_only` and `read_write` roles in their PostgreSQL database
		2. set `default_pg_role` to all databases to `read_only` in their SSO configuration
		3. create user accounts for the CTO and the support engineers and assign them the `read_write` role
		4. activate SSO and launch Mathesar internally
		
		The CTO will now have write access when logging in for the first time, but the customer success manager will only have read access.

### 6. (Optional) Set up additional IdPs

Mathesar supports logging in using multiple IdPs. To add an additional IdP, add a `provider2` block to your `sso.yml` file or `OIDC_CONFIG_DICT` JSON and configure it just like above.

### 7. Activate SSO

Once you've finished configuring SSO, restart Mathesar so it can load the updated `sso.yml` file or environment variable.

=== "For Docker Compose installations"

    ```bash
    docker compose -f docker-compose.yml down
    docker compose -f docker-compose.yml up -d
    ```

=== "For Linux, macOS, or WSL installations"

    ```bash
    sudo systemctl restart mathesar.service
    ```

=== "For DigitalOcean or Railway"

	Use their web interface.

Visit your Mathesar installation and you should see your IdP as a log in option:

![Sign into Mathesar with Okta](../assets/images/sso-login-page-okta.png)
/// caption
Mathesar's login screen with Okta SSO enabled.
///

## How to transition existing users to SSO

When a user logs in via SSO, Mathesar checks if their email address matches an existing user. If it does, they will be logged into the that existing account, with roles and access intact.

This means that if you already have users in Mathesar, you can transition to SSO seamlessly, as long as you **ensure that their existing account's email address exactly matches the email address used for SSO**. If it does not, you will need to manually update their email via Mathesar's UI before enabling SSO.

!!! warning "No exception for Mathesar admins"
	Once SSO is enabled, _any_ account logging in will be connected to an existing user that matches, regardless of Mathesar privileges. This also applies to the default administrator account.

## How to deactivate SSO

You can remove the option for users to use SSO by deleting the `sso.yml` file or `OIDC_CONFIG_DICT` environmental variable and restarting Mathesar. Mathesar will then only support password-based authentication.

!!! danger "Deactivating SSO may require manual password resets"
	Note that Mathesar users who only logged in via SSO will not have known passwords. If SSO is deactivated, these users will not be able to log in until an admin resets their password through the Mathesar UI.
