# Configuring Mathesar

The table below shows all available environment variables supported by Mathesar. See the specific installation guides for the applicable environment variables and instructions on how to set them.


## Backend Configuration {#backend}

### `SECRET_KEY`

- _**Required**_
- A 50 characters long random string used by Django for cryptographic signing.
- Refer [Django docs](https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY) for more details.
- You can generate a secret key using [this tool](https://djecrety.ir/).

### `ALLOWED_HOSTS`

- _Optional_. Defaults to `*`
- A comma-separated list of hostnames that can serve Mathesar. It will be added to Django [ALLOWED_HOSTS](https://docs.djangoproject.com/en/4.2/ref/settings/#allowed-hosts) settings.
- Add `localhost` if you want Mathesar to be accessible from localhost too.

### `DJANGO_DATABASE_URL`

- _**Required**_
- A Postgres connection string of the database which will be used for storing metadata related to Mathesar.
- It should be in the following format:

    ```
    postgres://user:password@hostname:port/database_name
    ```

    > **Example:**
    >
    > ```
    > postgres://mathesar:password@mathesar_db:5432/mathesar_django
    > ```
    >
    > The connection string above will connect to a database with the username `mathesar`, the password `password`, the hostname `mathesar_db`, the port `5432`, and the database name `mathesar_django`.

### `MATHESAR_DATABASES`

<!-- TODO -->

- _**Required**_
- Specifies the external databases to be managed by Mathesar.
- Format:

    ```text
    (id|connection_string),(id|connection_string),...
    ```

    > **Example**
    >
    > ```text
    > (db1|postgresql://u:p@example.com:5432/db1),(db2|postgresql://u:p@example.com:5432/db2)
    > ```
    >
    > This would connect to two external databases called `db1` and `db2` which are both accessed via the same user `u`, password `p`, hostname `example.com`, and port `5432`.

- Each database must have a unique id and a connection string.


## Caddy Reverse Proxy Configuration {#caddy}

### `DOMAIN_NAME`

- _**Required**_
- The [public URL](https://caddyserver.com/docs/caddyfile/concepts#addresses) that will be used to access Mathesar.
- Example values:
    - `https://example.com`
    - `localhost`
    - `http://localhost`
- If the protocol is `http`, then Caddy will serve traffic via HTTP only.
- If the protocol is `https` or is not specified, then Caddy will serve traffic via HTTPS (and will redirect all HTTP traffic to HTTPS). In this case Caddy will also attempt to [automatically setup HTTPS](https://caddyserver.com/docs/automatic-https) with [lets encrypt](https://letsencrypt.org/) for you.
- Set this to `localhost` if you wish Mathesar to be available on localhost only.
- Set the protocol to `http` if you don't want caddy to automatically handle the SSL, for example `http://example.com`

### `HTTP_PORT`

- _Optional_. Defaults to `80`
- Configures the port that Caddy will use when `DOMAIN_NAME` specifies a `http` protocol.
- It is recommended to use the default port `80` as features like automatic SSL [rely on it](https://caddyserver.com/docs/automatic-https#acme-challenges).
- If you already have a reverse proxy handling the SSL on the same system or if you are running on a non-root system, you can change it to a different port number to avoid conflicts or permission.

### `HTTPS_PORT`

- _Optional_. Defaults to `443`
- Configures the port that Caddy will use when `DOMAIN_NAME` specifies a `https` protocol or does not specify a protocol.
- If you want Caddy to handle the SSL certificate it is highly recommended to use the default port `443` as features like automatic SSL, and HTTPS redirection [rely on it](https://caddyserver.com/docs/automatic-https#acme-challenges).
- If you already have a reverse proxy handling the SSL on the same system or if you are running on a non-root system, you can change it to a different port number to avoid conflicts or permission errors.


## Database Configuration {#database}

### `POSTGRES_PORT`

- _Optional_. Defaults to `5432`
- The port the Postgres database listens on

### `POSTGRES_DB`

- _Optional_. Defaults to `mathesar_django`
- The name of the default database to create if it does not exist.

### `POSTGRES_USER`

- _Optional_. Defaults to `mathesar`
- This optional environment variable is used in conjunction with [`POSTGRES_PASSWORD`](#postgres_password) to set a user and its password.
- This variable will create the specified user with superuser power and a database only if a superuser with the same name does not exist.

### `POSTGRES_PASSWORD`

- _Optional_. Defaults to `mathesar`
- This environment variable is required for you to use the PostgreSQL image. It must not be empty or undefined.
- This environment variable sets the superuser password for PostgreSQL. The default superuser is defined by the [`POSTGRES_USER`](#postgres_user) environment variable.

