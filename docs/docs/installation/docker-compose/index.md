# Install Mathesar via Docker Compose (Deprecated)

!!! warning
This guide is not recommended anymore. If you are already using this installation guide, you don't have to make any changes, however, if you are doing a fresh installation, please look at [Docker installation](../docker/index.md) as it provides a straightforward Mathesar setup without any additional addons.



## Prerequisites

{% include 'snippets/docker-compose-prerequisites.md' %}

## Step-by-Step Guide {: #steps}

1. Navigate to a directory where you'd like to store your Mathesar configuration. We recommend `/etc/mathesar`, but it can be any directory.

    ```
    sudo mkdir -p /etc/mathesar
    cd /etc/mathesar
    ```

1. Download our [docker-compose.yml](https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/docker-compose.yml), and [.env.example](https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/.env.example) files to the directory you've chosen.

    ```
    sudo wget https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/docker-compose.yml
    sudo wget https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/.env.example
    ```

1. Rename `.env.example` to `.env`

    ```
    sudo mv .env.example .env
    ```

    Your custom `.env` file will be used for setting [configuration variables](../../configuration/env-variables.md).

1. Set up the database
    - To use the [default database server](../../configuration/customize-docker-compose#default-db) bundled with Mathesar, no additional steps are necessary. The database service will start along with the Mathesar web server.
    - Alternatively, you can [disable the default database server](../../configuration/customize-docker-compose.md#disable-db-service) if you plan on using an [existing database server](../../configuration/connect-to-existing-db.md).

1. Set up the web server.

    1. Edit your `.env` file, making the following changes:

        - Add the [**Backend Configuration** environment variables](../../configuration/env-variables.md#backend)
        - Customize the values of the environment variables to suit your needs.

        !!! example
            If you are using the [default database container](../../configuration/customize-docker-compose#default-db), your `.env` file should look something like this
            
            ``` bash
            ALLOWED_HOSTS='<your_domain_name>'
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

1. (Optional) Start the upgrade server to enable upgrading the docker image using the Mathesar UI.

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml up watchtower -d
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml up watchtower -d
        ```

1. Set up your user account

    Mathesar is now installed! You can use it by visiting `localhost` or the domain you've set up.

    You'll be prompted to set up an admin user account the first time you open Mathesar. Just follow the instructions on screen.

{% include 'snippets/docker-compose-administration.md' %}
