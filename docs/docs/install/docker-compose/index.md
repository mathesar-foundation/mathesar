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


## Install

1. Paste this command into your terminal to begin installing the latest version of Mathesar:

    ```sh
    bash <(curl -sfSL https://raw.githubusercontent.com/centerofci/mathesar/0.1.1/install.sh)
    ```

1. Follow the interactive prompts to configure your Mathesar installation.

1. When finished, the installer will display the URL where you can run Mathesar from your web browser.

!!! info "Getting help"
    If you run into any problems during installation, see [troubleshooting](./troubleshooting.md) or [open a ticket describing your problem](https://github.com/centerofci/mathesar/issues/new/choose).

## Start/stop the server {:#start-stop}

The Mathesar server needs to be running for you to use Mathesar. If you restart your machine, you'll need to start the server again.

- **Start** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml  up -d
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml  up -d
        ```

- **Stop** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml  down
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml  down
        ```

    This stops all Mathesar Docker containers and releases their ports.

!!! note
    If you customized the Mathesar configuration directory during installation, you'll need to change `/etc/mathesar` to your configuration directory.

## Upgrade

Manually upgrade Mathesar to the newest version:

=== "Linux"
    ```
    sudo docker exec mathesar-watchtower-1 /watchtower --run-once
    ```

=== "MacOS"
    ```
    docker exec mathesar-watchtower-1 /watchtower --run-once
    ```


!!! tip "Upgrade from within Mathesar"
    You can also run the upgrade from within Mathesar by logging into as an admin user and navigating to "Administration" (in the top right menu) > "Software Update"

## Uninstall

1. Remove all Mathesar Docker images and containers.

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml  down --rmi all -v
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml  down --rmi all -v
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
