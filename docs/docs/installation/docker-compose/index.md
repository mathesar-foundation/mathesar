# Install Mathesar via Docker Compose

## Prerequisites

{% include 'snippets/docker-compose-prerequisites.md' %}

## Step-by-Step Guide {: #steps}

1. Download our [docker-compose.yml](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml) file.

    ```
    sudo wget https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml
    ```

1. Open the downloaded docker-compose file using your favourite text editor.

1. Set the required environment variable(s) in the **CONFIG** section of the docker compose file.
    
    !!! Config       
        ``` bash
        # This is the only field that is required to be set by the user 
        # all the other fields are optional but useful for customizing your installation.
        SECRET_KEY: ${SECRET_KEY:?}

        # If you want to host Mathesar over the internet or your local network
        # replace or append your domain(s) or subdomain(s) with the default localhost domain.
        DOMAIN_NAME: ${DOMAIN_NAME:-http://localhost}

        # Edit these if not using the db service provided with the compose file.
        # This database will be used for storing Mathesar's internal metadata 
        # but can also be used for storing your data which can be configured using Mathesar's UI.
        POSTGRES_DB: ${POSTGRES_DB:-mathesar_django}
        POSTGRES_USER: ${POSTGRES_USER:-mathesar}
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-mathesar}
        POSTGRES_HOST: ${POSTGRES_HOST:-mathesar_db}
        POSTGRES_PORT: ${POSTGRES_PORT:-5432}
        ```

1. Run the docker compose file using:

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml up
        ```
    === "MacOS"
        ```
        docker compose -f docker-compose.yml up
        ```

1. Set up your user account

    Mathesar is now installed! You can use it by visiting `localhost` or the domain you've set up.
    You'll be prompted to set up an admin user account the first time you open Mathesar. Just follow the instructions on screen.


## How to host Mathesar over a custom domain with automatic https?
<!-- TODO -->

## How to connect to an external database?
<!-- TODO -->
{% include 'snippets/docker-compose-administration.md' %}
