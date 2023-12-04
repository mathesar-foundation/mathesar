# Environment Variables

This page contains all available environment variables supported by Mathesar. See the specific installation guides for the applicable environment variables and instructions on how to set them.


## Backend configuration {: #backend}

### `SECRET_KEY` {: #secret_key}

- **Description**: A unique random string used by Django for cryptographic signing ([see Django docs](https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY)).
- **Format**: A 50 character string
- **Additional information**: You can generate a secret key using [this tool](https://djecrety.ir/) if needed.


## Database configuration {: #db}
<!-- TODO -->
### `POSTGRES_DB`

- **Description**:
- **Format**:
- **Additional information**:

### `POSTGRES_USER`

- **Description**:
- **Format**:
- **Additional information**:

### `POSTGRES_PASSWORD`

- **Description**:
- **Format**:
- **Additional information**:

### `POSTGRES_HOST`

- **Description**:
- **Format**:
- **Additional information**:

### `POSTGRES_PORT`

- **Description**:
- **Format**:
- **Additional information**:


## Caddy reverse proxy configuration {: #caddy}

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


### `HTTP_PORT`

- **Description**: Configures the port that Caddy will use when `DOMAIN_NAME` specifies a `http` protocol.
- **Default value**: `80`
 
    !!! tip "Tip"
        - It is recommended to use the default port `80` as features like automatic SSL rely on it ([see Caddy docs](https://caddyserver.com/docs/automatic-https#acme-challenges)).
        - You probably want to change it to a different port if one of these is true:
            - you already have a reverse proxy handling SSL on your system
            - you are running Mathesar on a non-root system

### `HTTPS_PORT`

- **Description**: Configures the port that Caddy will use when `DOMAIN_NAME` specifies a `https` protocol or does not specify a protocol.
- **Default value**: `443`

    !!! tip "Tip"
        - If you want Caddy to handle the SSL certificate it is highly recommended to use the default port `443` as features like automatic SSL, and HTTPS redirection rely on it ([see Caddy docs](https://caddyserver.com/docs/automatic-https#acme-challenges)).
        - You probably want to change it to a different port if one of these is true:
            - you already have a reverse proxy handling SSL on your system
            - you are running Mathesar on a non-root system
