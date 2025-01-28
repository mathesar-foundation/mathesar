# Environment Variables for Configuration

This page contains all available environment variables supported by Mathesar. See the specific installation guides for the applicable environment variables and instructions on how to set them.


## Backend configuration {: #backend}

### `SECRET_KEY` {: #secret_key}

- **Description**: A unique random string used by Django for cryptographic signing ([see Django docs](https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY)). It helps Mathesar secure user sessions and encrypt saved PostgreSQL passwords.
- **Format**: A 50 character string
- **Additional information**:

    To generate a secret key you can use [this browser-based generator](https://djecrety.ir/) or run this command on MacOS or Linux:

    ```
    echo $(cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | head -c 50)
    ```

## Internal Database configuration {: #db}

!!!info
    The database specified in this section will be used to store Mathesar's internal data. Additionally, it can be optionally repurposed via Mathesar's UI to store user data.

### `POSTGRES_DB`

- **Description**: Specifies a name for the database that will be created and used by Mathesar for managing internal data.
- **Default value**: mathesar_django

### `POSTGRES_USER`

- **Description**: Specifies creation of a user with superuser privileges and a database with the same name.
- **Default value**: mathesar

### `POSTGRES_PASSWORD`

- **Description**: Specifies the superuser password that is required to be set for the PostgreSQL docker image.
- **Default value**: mathesar

### `POSTGRES_HOST`

- **Description**: Specifies the host name on which portgres listen for connections from client applications.
- **Default value**: mathesar_db

### `POSTGRES_PORT`

- **Description**: Specifies the port on which portgres listen for connections from client applications.
- **Default value**: 5432


## Caddy reverse proxy configuration {: #caddy}

!!!note
    These variables are only needed if you're using the Caddy configuration in our [default Docker Compose](install-via-docker-compose.md#steps) file.

### `DOMAIN_NAME`

- **Description**: The public URL that will be used to access Mathesar ([see Caddy docs](https://caddyserver.com/docs/caddyfile/concepts#addresses)).
- **Format**: A URL or hostname

    !!! info "Example values"
        - `https://example.com`
        - `localhost`
        - `http://localhost`

- **Additional information**
    - If the protocol is `http`, then Caddy will serve traffic via HTTP only.
    - If the protocol is `https` or is not specified, then Caddy will serve traffic via HTTPS (and will redirect all HTTP traffic to HTTPS). In this case Caddy will also attempt to automatically set up HTTPS with [Let's Encrypt](https://letsencrypt.org/) for you ([see Caddy docs](https://caddyserver.com/docs/automatic-https)).

    !!! tip "Tip"
        - Set this to `localhost` if you'd like Mathesar to be available only on localhost
        - Set the protocol to `http` if you don't want Caddy to automatically handle setting up SSL, e.g. `http://example.com`
