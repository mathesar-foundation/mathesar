# Environment Variables

This page contains all available environment variables supported by Mathesar. See the specific installation guides for the applicable environment variables and instructions on how to set them.


## Backend configuration {: #backend}

### `SECRET KEY`

- **Description**: A unique random string used by Django for cryptographic signing ([see Django docs](https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY)).
- **Format**: A 50 character string
- **Additional information**: You can generate a secret key using [this tool](https://djecrety.ir/) if needed.


### `ALLOWED_HOSTS`

- **Description**: A list of hostnames that Mathesar will be accessible at ([see Django docs](https://docs.djangoproject.com/en/4.2/ref/settings/#allowed-hosts)). 
    - Hostnames should not contain the protocol (e.g. `http`) or trailing slashes. 
    - You can use `localhost` in this list.
- **Format**: Comma separated string of hostnames

    !!! success "Valid values"
        - `mathesar.example.com, localhost`
        - `.localhost, mathesar.example.com, 35.188.184.125`

    !!! failure "Invalid values"
        - `http://mathesar.example.com/` - contains HTTP protocol and a trailing slash
        - `https://mathesar.example.com` - contains HTTPS protocol
        - `localhost/, 35.188.184.125` - contains trailing slash after `localhost`

### `DJANGO_DATABASE_URL`

- **Description**: A Postgres connection string of the database used for **Mathesar's internal usage**. 
- **Format**:`postgres://user:password@hostname:port/database_name`
    - The connection string above will connect to a database with username `user`, password `password`, hostname `mathesar_db`, port `5432`, and database name `mathesar_django`.

### `MATHESAR_DATABASES` 

- **Description**: Names and connection information for databases managed by Mathesar. These databases will be accessible through the UI.
- **Format**:`(unique_id|connection_string),(unique_id|connection_string),...` 
    - e.g. `(db1|postgresql://u:p@example.com:5432/db1),(db2|postgresql://u:p@example.com:5432/db2)`
    - This would set Mathesar to connect to two databases, `db1` and `db2` which are both accessed via the same user `u`, password `p`, hostname `example.com`, and port `5432`.


## Caddy reverse proxy configuration {: #caddy}

### `DOMAIN_NAME`

- **Description**: The public URL that will be used to access Mathesar ([see Caddy docsL](https://caddyserver.com/docs/caddyfile/concepts#addresses)).
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
