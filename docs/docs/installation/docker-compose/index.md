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
        ```yaml
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


## Starting and stopping Mathesar {:#start-stop}

The Mathesar server needs to be running for you to use Mathesar. If you restart your machine, you'll need to start the server again.

- **Start** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml up -d
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml up -d
        ```
    !!! Info
        Exclude the `-d` flag if you'd like to see the container's logs.

- **Stop** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml down
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml down
        ```

    This stops all Mathesar Docker containers and releases their ports.


## Optional configurations

- ### **Hosting Mathesar over a custom domain with https**

    If you want Mathesar to be accessible over the internet, you'll probably want to set up a domain or sub-domain to use. **If you don't need a domain, you can skip this section.**

    **Ensure that the DNS for your sub-domain or domain is pointing to the public IP address of the machine that you're installing Mathesar on**.

    Add your domain(s) or sub-domain(s) to the [`DOMAIN_NAME`](http://localhost:9000/configuration/env-variables/#domain_name) environment variable, in the **CONFIG** section of the docker-compose file.
    !!! example
        ```yaml
        DOMAIN_NAME: ${DOMAIN_NAME:-yourdomain.org, yoursubdomain.example.org}
        ```
    
    Restart the docker containers for the configuration to take effect.

- ### **Connecting to an external database**
   <!-- TODO -->
    TODO: Add how to connect to databases once UI for DB connections is merged.
    Perhaps add screenshots??


## Upgrading Mathesar {:#upgrade}

Manually upgrade Mathesar to the newest version:

=== "Linux"
    ```
    sudo docker compose -f docker-compose.yml up --force-recreate --build service
    ```

=== "MacOS"
    ```
    docker compose -f docker-compose.yml up --force-recreate --build service
    ```
