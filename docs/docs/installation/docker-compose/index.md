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
    sudo wget https://github.com/centerofci/mathesar/raw/master/docker-compose.yml
    sudo wget https://github.com/centerofci/mathesar/raw/master/.env.example
    ```

1. Rename `.env.example` to `.env`

    ```
    sudo mv .env.example .env
    ```

    Your custom `.env` file will be used for setting [configuration variables](../../configuration/env-variables.md).

1. Set up the database
    - To use the [default database server](#default-db) bundled with Mathesar, no additional steps are necessary. The database service will start along with the Mathesar web server.
    - Alternatively, you can [disable the default database server](../../configuration/customize-docker-compose.md#disable-db-service) if you plan on using an [existing database server](../../configuration/connect-to-existing-db.md).

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
