# Install Mathesar via Docker Compose

## Prerequisites

{% include 'snippets/docker-compose-prerequisites.md' %}

## Installation Steps {: #steps}

1. Navigate to a directory where you'd like to store your Mathesar configuration. By convention, we do it within `/etc/mathesar`, but it can be a different directory if you like.

    ```
    sudo mkdir -p /etc/mathesar
    cd /etc/mathesar
    ```

1. Download our [docker-compose.yml](https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/docker-compose.yml), and [.env.example](https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/.env.example) files to your configuration directory.

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
            If you are using the [default database container](../../configuration/customize-docker-compose#default-db). Your `.env` file should look something like this
            
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

{% include 'snippets/docker-compose-administration.md' %}
