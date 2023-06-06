# Environment Variables

This page contains all available environment variables supported by Mathesar. See the specific installation guides for the applicable environment variables and instructions on how to set them.


## Backend configuration {: #backend}

<style>
table th:first-of-type {
    width: 25%;
}
</style>

| Name | Description | Default |
| - | - | - |
| `SECRET_KEY` | A 50-char random string used by Django for cryptographic signing ([see Django docs](https://docs.djangoproject.com/en/3.2/ref/settings/#std:setting-SECRET_KEY)).<br/><br/>You can generate a secret key using [this tool](https://djecrety.ir/) | _No default._ | 
| `ALLOWED_HOSTS` | A comma-separated list of hostnames that Mathesar will be accessible at ([see Django docs](https://docs.djangoproject.com/en/4.2/ref/settings/#allowed-hosts)).<br/><br/>Hostnames should not contain the protocol (e.g. `http`) or trailing slashes. You can use `localhost` in this list. | _No default._ | 
| `DJANGO_DATABASE_URL` | A Postgres connection string of the database used for Mathesar's internal usage. Format: `postgres://user:password@hostname:port/database_name`<br/><br/>The connection string above will connect to a database with username `user`, password `password`, hostname `mathesar_db`, port `5432`, and database name `mathesar_django`.<br/><br/>This database must exist before it can be used. If you're using our [guided installation](../installation/guided-install/), we'll set up the database during the installation process. Our [Docker Compose](../installation/docker-compose/) profiles also provide a default database server.<br/><br/>If you're using another installation method, you'll need to ensure the database is created before setting this configuration variable. | _Default depends on installation method._ | 
| `MATHESAR_DATABASES` | A list of databases managed by Mathesar. These databases will be accessible through the UI.<br/><br/>Format: `(unique_id|connection_string),(unique_id|connection_string),...` e.g. `(db1|postgresql://u:p@example.com:5432/db1),(db2|postgresql://u:p@example.com:5432/db2)`<br/><br/> This would set Mathesar to connect to two databases, `db1` and `db2` which are both accessed via the same user `u`, password `p`, hostname `example.com`, and port `5432`.<br/><br/>Please note that if you're using our [Docker Compose]((../installation/docker-compose/)) or [guided installation](../installation/guided-install/), Mathesar will attempt to create any databases that do not already exist whenever Docker is restarted. | _Default depends on installation method._ | 


#### Troubleshooting

##### `ALLOWED_HOSTS`
!!! success "Valid values"
    - `mathesar.example.com, localhost`
    - `.localhost, mathesar.example.com, 35.188.184.125`

!!! failure "Invalid values"
    - `http://mathesar.example.com/` - contains HTTP protocol and a trailing slash
    - `https://mathesar.example.com` - contains HTTPS protocol
    - `localhost/, 35.188.184.125` - contains trailing slash after `localhost`


## Caddy reverse proxy configuration {: #caddy}

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
