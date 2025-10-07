# Environment Variables
This page contains all available environment variables supported by Mathesar. See the specific installation guides for the applicable environment variables and instructions on how to set them.

## Backend configuration {: #backend}

### `SECRET_KEY` {: #secret_key}

- **Description**: A unique random string used by Django for cryptographic signing ([see Django docs](https://docs.djangoproject.com/en/4.2/ref/settings/#std:setting-SECRET_KEY)). It helps Mathesar secure user sessions and encrypt saved PostgreSQL passwords. If not set as an environment variable, Mathesar will generate one at random, and persist that on disk. The variable only needs to be set for backwards compatibility, or in deployments where persistence of secret information on disk is not possible.
- **Format**: A 50 character string
- **Additional information**:

    To generate a secret key you can use [this browser-based generator](https://djecrety.ir/) or run this command on MacOS or Linux:

    ```
    echo $(cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | head -c 50)
    ```

### `ALLOWED_HOSTS` {: #allowed_hosts}

- **Description**: A set of strings representing the host/domain names that Django is allowed to serve. This is a security measure to prevent HTTP Host header attacks ([see Django docs](https://docs.djangoproject.com/en/4.2/ref/settings/#allowed-hosts)).
- **Format**: A set of host/domain names separated by a comma
- **Default value**: `.localhost,127.0.0.1,[::1]`

### `WEB_CONCURRENCY` {: #web_concurrency}

- **Description**: Sets the number of Gunicorn workers, affecting the number of concurrent requests Mathesar can handle. Bigger is better, subject to system resources. The typically-recommended number is `2 * $(NUM_PROC) + 1`, where `NUM_PROC` is the number of logical cores on your machine. So, if Mathesar is running on a server with 4 vCPUs, then this should be set to 9.
- **Format**: An integer.


## Internal database configuration {: #db}

!!! note "Default values below are from our [docker-compose.yml](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml) file, used if installing via [Docker Compose](./install-via-docker-compose.md)."

The database specified in this section is used to store Mathesar's internal data. If desired, it can also be [connected to Mathesar's UI](http://localhost:9000/user-guide/databases/#connection) to store user data.


### `POSTGRES_DB`

- **Description**: Specifies a name for the database that will be created and used by Mathesar for managing internal data.
- **Default value**: `mathesar_django`

### `POSTGRES_USER`

- **Description**: Specifies creation of a user with superuser privileges and a database with the same name.
- **Default value**: `mathesar`

### `POSTGRES_PASSWORD` (optional)

- **Description**: Specifies the superuser password that is required to be set for the PostgreSQL docker image.
- **Default value**: `mathesar`

### `POSTGRES_HOST`

- **Description**: Specifies the host name on which portgres listen for connections from client applications.
- **Default value**: `mathesar_db`
    - When installing via docker, this value can reference:
        - A Docker service name (e.g., `mathesar_django`)
        - A TCP host address (e.g., `host.docker.internal`)
        - A Unix socket path (e.g., `/var/run/postgresql`)

### `POSTGRES_PORT` (optional)

- **Description**: Specifies the port on which portgres listen for connections from client applications.
- **Default value**: `5432`


## Caddy reverse proxy configuration {: #caddy}

!!! info "**OPTIONAL**"
	Only needed if you're using the Caddy configuration in our [default Docker Compose](install-via-docker-compose.md#steps) file.

### `DOMAIN_NAME`

- **Description**: The public URL that will be used to access Mathesar ([see Caddy docs](https://caddyserver.com/docs/caddyfile/concepts#addresses)).
- **Format**: A URL or hostname

    !!! example "Example values"
        - `https://example.com`
        - `localhost`
        - `http://localhost`

- **Additional information**
    - If the protocol is `http`, then Caddy will serve traffic via HTTP only.
    - If the protocol is `https` or is not specified, then Caddy will serve traffic via HTTPS (and will redirect all HTTP traffic to HTTPS). In this case Caddy will also attempt to automatically set up HTTPS with [Let's Encrypt](https://letsencrypt.org/) for you ([see Caddy docs](https://caddyserver.com/docs/automatic-https)).

    !!! tip "Tip"
        - Set this to `localhost` if you'd like Mathesar to be available only on localhost
        - Set the protocol to `http` if you don't want Caddy to automatically handle setting up SSL, e.g. `http://example.com`

## Single sign-on (SSO) configuration {: #sso}

!!! info "**OPTIONAL**"
    Only used if [using SSO](./single-sign-on.md) in installations where the local filesystem is inaccessible.

### `OIDC_CONFIG_DICT` (optional)

- **Description**: The configuration for enabling SSO and configuring providers in Mathesar.
- **Format**: A stringified JSON representation of the config in the [`sso.yml` file](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/sso.yml.example).

    !!! example
        ```env
         OIDC_CONFIG_DICT="{\"version\": 1,\"oidc_providers\": {\"provider1\": {\"provider_name\": \"okta\",\"client_id\": \"client-id\",\"secret\": \"client-secret\",\"server_url\": \"https://trial-2872264-admin.okta.com\"}}}"
        ```


- **Additional information**: The following tools might help you convert the YAML syntax from `sso.yml` into the proper format:
    - [Convert YAML to JSON](https://onlineyamltools.com/convert-yaml-to-json)
    - [JSON stringify online](https://jsonformatter.org/json-stringify-online)

## File backend configuration

!!! info "**OPTIONAL**"
    Only needed if [using file columns](../user-guide/files.md), in installations where the local filesystem is inaccessible.

### `FILE_STORAGE_DICT` (optional)

- **Description**: The configuration for enabling SSO and configuring providers in Mathesar.
- **Format**: A stringified JSON representation of the config in the [`sso.yml` file](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/sso.yml.example).

    !!! example
        ```env
         FILE_STORAGE_DICT="{\"default\":{\"protocol\":\"s3\",\"nickname\":\"Example\",\"prefix\":\"mathesar-storage\",\"kwargs\":{\"client_kwargs\":{\"endpoint_url\":\"https:\/\/storage-example.mathesar.org\",\"region_name\":\"auto\",\"aws_access_key_id\":\"XXX\",\"aws_secret_access_key\":\"XXX\"}}}}"
        ```

- **Additional information**: The following tools might help you convert the YAML syntax from `file_storage.yml` into the proper format:
    - [Convert YAML to JSON](https://onlineyamltools.com/convert-yaml-to-json)
    - [JSON stringify online](https://jsonformatter.org/json-stringify-online)
