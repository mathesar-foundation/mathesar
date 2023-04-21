# Install Mathesar via Docker Compose

## Requirements

- You need **[Docker](https://docs.docker.com/desktop/) and [Docker Compose](https://docs.docker.com/compose/install/)**.

    We've tested with Docker v23 and Docker Compose v2.10. Older versions may not work.

- You need **root access**.

- If using a custom domain name

    Have your domain name ready during the installation process and have your DNS pointing to your Mathesar server.

- If connecting to an existing database

    - Ensure the external database can accept network connections from your Mathesar server.
    - Have the following information handy before installation:

        - Database hostname _(cannot [yet](https://github.com/centerofci/mathesar/issues/2571) be `localhost`)_
        - Database port
        - Database name
        - Database username _(should exist and be a `SUPERUSER` [more info](https://www.postgresql.org/docs/13/sql-createrole.html))_
        - Database password

- If installing on Windows, you need to have [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) installed first.


## Install using interactive script

1. Paste this command into your terminal to begin installing the latest version of Mathesar:

    ```sh
    bash <(curl -sfSL https://raw.githubusercontent.com/centerofci/mathesar/0.1.1/install.sh)
    ```

1. Follow the interactive prompts to configure your Mathesar installation.

1. When finished, the installer will display the URL where you can run Mathesar from your web browser.

!!! note "Connecting to a local database"
    Once you have successfully installed Mathesar, if you wish to connect it to an existing database that is running locally on the host machine, you can refer to the following [guide](./connecting-local-db.md).

!!! info "Getting help"
    If you run into any problems during installation, see [troubleshooting](./troubleshooting.md) or [open a ticket describing your problem](https://github.com/centerofci/mathesar/issues/new/choose).


## Manual Install
Services needed for Mathesar
- Database server
- Mathesar Webserver
- WatchTower Upgrade Server

## Steps
1. Open the Mathesar configuration directory where you'd like to install Mathesar. By default, we do it within `/etc/mathesar`

2. Download necessary files into the configuration directory

   - Download the `docker-compose.yml` file from [https://github.com/centerofci/mathesar/raw/master/docker-compose.yml](https://github.com/centerofci/mathesar/raw/master/docker-compose.yml)
   - Download the `docker-compose.common.yml` file from [https://github.com/centerofci/mathesar/raw/master/docker-compose.common.yml](https://github.com/centerofci/mathesar/raw/master/docker-compose.common.yml)
   - Download the example `.env.example` file used for setting the [configuration variables](../configuration.md) from [https://github.com/centerofci/mathesar/raw/master/.env.example](https://github.com/centerofci/mathesar/raw/master/.env.example)
   - Rename the downloaded `.env.example` to `.env`
   - (Optional) If you are planning to install the Caddy reverse proxy to serve static files, set up an SSL certificate, download the example `Caddyfile` from [https://github.com/centerofci/mathesar/raw/master/Caddyfile](https://github.com/centerofci/mathesar/raw/master/Caddyfile)


3. Start the database server(Skip this step if you already have a database server running)
    - Open the `.env` file in your favourite text editor.
    - Add the database configuration environment variables to the `.env` file. Refer to the [Database Configuration Documentation](../configuration.md#database-configuration) for information on the environment variables.
    - Your `.env` file should look something like this
      ```bash
        POSTGRES_USER='mathesar'
        POSTGRES_PASSWORD='mathesar'
        POSTGRES_PORT='5432'
      ```
    - Start the database server
          ```
          docker compose -f docker-compose.yml up db
          ```

3. Start the Mathesar web server
    - Open the `.env` file in your favourite text editor.
    - Add the Mathesar server configuration environment variables to the `.env` file. Refer to the [Backend Documentation](../configuration.md#backend-configuration) for information on the environment variables.
    - If you created a database server from the previous step. Your `.env` file should look something like this
      ```bash
        POSTGRES_USER='mathesar'
        POSTGRES_PASSWORD='mathesar'
        POSTGRES_PORT='5432'
        ALLOWED_HOSTS='.localhost, 127.0.0.1'
        SECRET_KEY='dee551f449ce300ee457d339dcee9682eb1d6f96b8f28feda5283aaa1a21'
        DJANGO_DATABASE_KEY='default'
        DJANGO_DATABASE_URL='postgresql://mathesar:mathesar@mathesar_db:5432/mathesar_django'
        MATHESAR_DATABASES='(mathesar_tables|postgresql://mathesar:mathesar@mathesar_db:5432/mathesar)'
        DJANGO_SUPERUSER_PASSWORD='password'
      ```
    - Start the mathesar web server
          ```
          docker compose -f docker-compose.yml up mathesar_service
          ```
4. Start the Caddy reverse proxy
    - Open the `.env` file in your favourite text editor.
    - Add the Caddy reverse proxy configuration environment variables to the `.env` file. Refer to the [Caddy Reverse Proxy Documentation](../configuration.md#caddy-reverse-proxy-configuration) for information on the environment variables.
    - If you created a database server from the previous step. Your `.env` file should look something like this
      ```bash
        POSTGRES_USER='mathesar'
        POSTGRES_PASSWORD='mathesar'
        POSTGRES_PORT='5432'
        ALLOWED_HOSTS='.localhost, 127.0.0.1'
        SECRET_KEY='dee551f449ce300ee457d339dcee9682eb1d6f96b8f28feda5283aaa1a21'
        DJANGO_DATABASE_KEY='default'
        DJANGO_DATABASE_URL='postgresql://mathesar:mathesar@mathesar_db:5432/mathesar_django'
        MATHESAR_DATABASES='(mathesar_tables|postgresql://mathesar:mathesar@mathesar_db:5432/mathesar)'
        DJANGO_SUPERUSER_PASSWORD='password'
        DOMAIN_NAME=':80'
        HTTP_PORT='80'
      ```
    - Start the caddy reverse proxy server
          ```
          docker compose -f docker-compose.yml -f docker-compose.common.yml up caddy-reverse-proxy
          ```

## Start/stop the server {:#start-stop}

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

## Upgrade

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
    sudo docker docker-compose.yml up --force-recreate --build mathesar_service
    ```

=== "MacOS"
    ```
    sudo docker docker-compose.yml up --force-recreate --build mathesar_service
    ```


!!! tip "Upgrade from within Mathesar"
    You can also run the upgrade from within Mathesar by logging into as an admin user and navigating to "Administration" (in the top right menu) > "Software Update"

## Uninstall

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
