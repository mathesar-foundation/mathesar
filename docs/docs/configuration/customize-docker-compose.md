# Customize Docker Compose related Installations

!!! info ""
    This document is related to Mathesar running in Docker Compose related environments. This is applicable for the [Guided Installation method](../installation/guided-install/index.md), and [Docker Compose Installation method](../installation/docker-compose/index.md).

### Default database server {: #default-db}

The default `docker-compose.yml` includes a `db` service that automatically starts a Postgres database server container called `mathesar_db`. This service allows you to start using Mathesar immediately to store data in a Postgres database without administering a separate Postgres server outside Mathesar.

The `db` service runs on the [internal docker compose port](https://docs.docker.com/compose/compose-file/compose-file-v3/#expose) `5432`. The internal port is not bound to the host to avoid conflicts with other services running on port `5432`.

Additionally, it comes with a default database and a superuser. This database can come in handy for storing Mathesar's [metadata](./env-variables.md#django_database_url). The credentials for the Default database are:

```
DATABASE_NAME='mathesar_django'
USER='mathesar'
PASSWORD='mathesar'
```

you can [disable the default database server](#disable-db-service) if you plan on using an [existing database server](../configuration/connect-to-existing-db.md).

### Disable the default database server {: #disable-db-service}

The default `docker-compose.yml` automatically starts a [Postgres database server container](#default-db). You may disable it if you plan on using a different Database server.

In the `docker-compose.yml` file, comment out the `db` services and the `depends_on` field of the `service`.

```yaml hl_lines="2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 29 30 31"
services:
  # db:
  #   image: postgres:13
  #   container_name: mathesar_db
  #   environment:
  #   # These environment variables are used to create a database and superuser when the `db` service starts.
  #   # Refer to https://hub.docker.com/_/postgres for more information on these variables.
  #     - POSTGRES_DB=${POSTGRES_DB-mathesar_django}
  #     - POSTGRES_USER=${POSTGRES_USER-mathesar}
  #     - POSTGRES_PASSWORD=${POSTGRES_PASSWORD-mathesar}
  #   expose:
  #     - "5432"
  #   volumes:
  #     - postgresql_data:/var/lib/postgresql/data
  #   healthcheck:
  #     test: [ "CMD-SHELL", "pg_isready -d $${POSTGRES_DB-mathesar_django} -U $${POSTGRES_USER-mathesar}"]
  #     interval: 5s
  #     timeout: 1s
  #     retries: 30
  #     start_period: 5s

  # ...
  service:
    # ...
    volumes:
      - static:/code/static
      - media:/code/media
    # Comment the below field to disable starting the database service automatically
    # depends_on:
    #   db:
    #    condition: service_healthy
```

After this change, Mathesar will no longer start the `db` service automatically.

### Run Mathesar on a non-standard HTTP port {: #non-standard-port}

By default, Caddy serves the Mathesar web application on a port as determined by the protocol within your [`DOMAIN_NAME` environment variable](./env-variables.md#domain_name).

- For `http` domain names it uses  port `80`.
- For `https` domain names (as is the default, if not specified) it uses port `443` and redirects any traffic pointed at `http` to `https`. In this case, Caddy also creates an SSL certificate [automatically](https://caddyserver.com/docs/automatic-https#activation).

    !!! warning
          If you don't have access to port `443`, avoid using `https` domain names on a non-standard port. Due to the following reasons:

          - Caddy won't be able to verify the SSL certificate when running on a non-standard port.
          - Browsers automatically redirect traffic sent to the `http` domain to the standard `https` port (443), rather than to any non-standard `HTTPS_PORT` port that you may have configured.

To use a non-standard port:

1. Edit your `.env` file and set either the [`HTTP_PORT`](./env-variables.md#http_port) or the [`HTTPS_PORT`](./env-variables.md#https_port) environment variable (depending on the protocol you're using).

    !!! example
        To serve Mathesar at `http://localhost:9000`, include the following in your `.env` file:

        ```bash
        DOMAIN_NAME='http://localhost'
        HTTP_PORT=9000
        ```

1. Restart the container 

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml up caddy-reverse-proxy -d
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml up caddy-reverse-proxy -d
        ```
