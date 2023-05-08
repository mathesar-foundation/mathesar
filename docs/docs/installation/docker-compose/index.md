# Install Mathesar via Docker Compose

## Requirements

{% include 'snippets/docker-compose-prerequisites.md' %}

## Installation Steps {: #steps}

1. Navigate to a directory where you'd like to store your Mathesar configuration. By convention, we do it within `/etc/mathesar`, but it can be a different directory if you like.

    ```
    sudo mkdir -p /etc/mathesar
    cd /etc/mathesar
    ```

1. Download our [docker-compose.yml](https://github.com/centerofci/mathesar/raw/master/docker-compose.yml), and [.env.example](https://github.com/centerofci/mathesar/raw/master/.env.example) files to your configuration directory.

    ```
    wget https://github.com/centerofci/mathesar/raw/master/docker-compose.yml
    wget https://github.com/centerofci/mathesar/raw/master/.env.example
    ```

1. Rename `.env.example` to `.env`

    ```
    mv .env.example .env
    ```

    Your custom `.env` file will be used for setting [configuration variables](../../configuration/env-variables.md).

1. Set up the database
    - To use the [default database server](#default-db) bundled with Mathesar, no additional steps are necessary. The database service will start along with the Mathesar web server.
    - Alternatively, you can [disable the default database server](#external-db-service) if you plan on using an existing database server.

1. Set up the web server.

    1. Edit your `.env` file, making the following changes:

        - Add the [**Backend Configuration** environment variables](../../configuration/env-variables.md#backend)
        - Customize the values of the environment variables to suit your needs.

        !!! example
            If you are using the [default database container](#default-db). Your `.env` file should look something like this
            
            ``` bash
            ALLOWED_HOSTS='https://<your_domain_name>'
            SECRET_KEY='dee551f449ce300ee457d339dcee9682eb1d6f96b8f28feda5283aaa1a21'
            DJANGO_DATABASE_URL='postgresql://mathesar:mathesar@mathesar_db:5432/mathesar_django'
            MATHESAR_DATABASES='(mathesar_tables|postgresql://mathesar:mathesar@mathesar_db:5432/mathesar)'
            ```

    1. Start the Mathesar web server.

        === "Linux"
            ```
            sudo docker compose -f docker-compose.yml up service -d
            ```

        === "MacOS"
            ```
            docker compose -f docker-compose.yml up service -d
            ```

1. Set up the Caddy reverse proxy.

    1. Edit your `.env` file, adding the [**Caddy Reverse Proxy** environment variables](../../configuration/env-variables.md#caddy).
    
    1. Start the Caddy reverse proxy

        === "Linux"
            ```
            sudo docker compose -f docker-compose.yml up caddy-reverse-proxy -d
            ```

        === "MacOS"
            ```
            docker compose -f docker-compose.yml up caddy-reverse-proxy -d
            ```

1. Create a superuser

    ```bash
    docker exec -it mathesar_service python manage.py createsuperuser
    ```

    A prompt will appear to ask for the superuser details. Fill in the details to create a superuser. At least one superuser is necessary for accessing Mathesar.
    
    See the Django docs for more information on the [`createsuperuser` command](https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser)

1. (Optional) Start the Upgrade server to enable upgrading the docker image using the Mathesar UI.

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml up watchtower -d
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml up watchtower -d
        ```

## Administration

### Start/stop the server {:#start-stop}

The Mathesar server needs to be running for you to use Mathesar. If you restart your machine, you'll need to start the server again.

- **Start** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml up -d
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml up -d
        ```

- **Stop** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml down
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml down
        ```

    This stops all Mathesar Docker containers and releases their ports.

!!! note
    If you customized the Mathesar configuration directory during installation, you'll need to change `/etc/mathesar` to your configuration directory.

### Upgrade

!!! tip "Upgrade from within Mathesar"
    You can also run the upgrade from within Mathesar by logging in as an admin user and navigating to "Administration" (in the top right menu) > "Software Update"

Manually upgrade Mathesar to the newest version using watch tower:

=== "Linux"
    ```
    sudo docker exec mathesar-watchtower-1 /watchtower --run-once
    ```

=== "MacOS"
    ```
    docker exec mathesar-watchtower-1 /watchtower --run-once
    ```

Manually upgrade Mathesar to the newest version without using watch tower:

=== "Linux"
    ```
    sudo docker compose -f docker-compose.yml up --force-recreate --build service
    ```

=== "MacOS"
    ```
    docker compose -f docker-compose.yml up --force-recreate --build service
    ```

### Uninstall

1. Remove all Mathesar Docker images and containers.

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml down --rmi all -v
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml down --rmi all -v
        ```

1. Remove configuration files.

    ```sh
    sudo rm -rf /etc/mathesar
    ```

    !!! note
        If you customized the Mathesar configuration directory during installation, you'll need to change `/etc/mathesar` to your configuration directory.

1. Remove Mathesar internal schemas.

    **If you connected Mathesar to an existing database**, the installation process would have created a new schema for Mathesar's use. You can remove this schema from that database as follows:

    1. Connect to the database.

        ```
        psql -h <DB HOSTNAME> -p <DB PORT> -U <DB_USER> <DB_NAME>
        ```

    2. Delete the schema.

        ```postgresql
        DROP SCHEMA mathesar_types CASCADE;
        ```

        !!! danger 
            Deleting this schema will also delete any database objects that depend on it. This should not be an issue if you don't have any data using Mathesar's custom data types.


## Additional Information

### Default database server {: #default-db}

The default `docker-compose.yml` includes a `db` service that automatically starts a Postgres database server container called `mathesar_db`. This service allows you to  start using Mathesar immediately to store data in a Postgres database without administering a separate Postgres server outside Mathesar.

The `db` service runs on the [internal docker compose port](https://docs.docker.com/compose/compose-file/compose-file-v3/#expose) `5432`. The internal port is not bound to the host to avoid conflicts with other services running on port `5432`.

Additionally, it comes with a default database and a superuser. This database can come in handy for storing Mathesar's [metadata](../../configuration/env-variables.md#django_database_url). The credentials for the Default database are:

```
DATABASE_NAME='mathesar_django'
USER='mathesar'
PASSWORD='mathesar'
```

you can [disable the default database server](#external-db-service) if you plan on using an existing database server.
           
## Customization

### Connect Mathesar to an existing database server {: #external-db-service}

1. On the existing database server, [create a new database](https://www.postgresql.org/docs/current/sql-createdatabase.html) for Mathesar to store its metadata.

    ```bash
    psql -c 'create database mathesar_django;'
    ```

1. Within your `.env` settings, configure the [`DJANGO_DATABASE_URL` setting](../../configuration/env-variables.md#django_database_url) to point to the database you just created.

1. (Optional) At this point, you may [disable Mathesar's default database server](#disable-db-service) if you like.

### Disable the default database server {: #disable-db-service}

The default `docker-compose.yml` automatically starts a [Postgres database server container](#default-db). You may disable it if you plan on using a different Database server.

In the `docker-compose.yml` file, comment out the `db` service from the `depends_on` field of the `service`.

```yaml hl_lines="10 11"
services:
  # ...
  service:
    # ...
    volumes:
      - static:/code/static
      - media:/code/media
    depends_on:
      # Comment the below field to disable starting the database service automatically
      # db:
      #  condition: service_healthy
```

After this change, Mathesar will no longer start the `db` service automatically.

### Run Mathesar on a non-standard HTTP port {: #non-standard-port}

By default, Caddy serves the Mathesar web application on a port as determined by the protocol within your [`DOMAIN_NAME` environment variable](../../configuration/env-variables.md#domain_name).

- For `http` domain names it uses  port `80`.
- For `https` domain names (as is the default, if not specified) it uses port `443` and redirects any traffic pointed at `http` to `https`. In this case, Caddy also creates an SSL certificate [automatically](https://caddyserver.com/docs/automatic-https#activation).

    !!! warning
          If you don't have access to port `443`, avoid using `https` domain names on a non-standard port. Due to the following reasons:

          - Caddy won't be able to verify the SSL certificate when running on a non-standard port.
          - Browsers automatically redirect traffic sent to the `http` domain to the standard `https` port (443), rather than to any non-standard `HTTPS_PORT` port that you may have configured.

To use a non-standard port:

1. Edit your `.env` file and set either the [`HTTP_PORT`](../../configuration/env-variables.md#http_port) or the [`HTTPS_PORT`](../../configuration/env-variables.md#https_port) environment variable (depending on the protocol you're using).

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
