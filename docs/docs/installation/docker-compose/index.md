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
        # Customize your Mathesar installation with the following variables, if desired.

        x-config: &config
          # (Required) Replace '?' with '-' followed by a 50 character random string.
          # You can generate one at https://djecrety.ir/
          SECRET_KEY: ${SECRET_KEY:?}

          # (Optional) Replace 'http://localhost' with custom domain(s) e.g.
          # 'yourdomain.com, 127.0.0.1' to manage the host(s) at which you want to
          # access Mathesar over http or https
          DOMAIN_NAME: ${DOMAIN_NAME:-http://localhost}

          # Edit the POSTGRES_* variables if you are not using the db service provided
          # below, or if you want to use a custom database user.

          # (Optional) Replace 'mathesar_django' with any custom name for the internal
          # database managed by mathesar web-service
          POSTGRES_DB: ${POSTGRES_DB:-mathesar_django}

          # (Optional) Replace 'mathesar' with any custom username for the
          # aforementioned database
          POSTGRES_USER: ${POSTGRES_USER:-mathesar}

          # (Optional) Replace 'mathesar' with any custom password for the
          # aforementioned database

          POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-mathesar}
          # (Optional) Replace 'mathesar_db' with the name of the host running postgres
          POSTGRES_HOST: ${POSTGRES_HOST:-mathesar_db}

          # (Optional) Replace '5432' with the port on which postgres is running
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

    **Ensure that the DNS for your domain or sub-domain is pointing to the public IP address of the machine that you're installing Mathesar on**.

    Add your domain(s) or sub-domain(s) to the [`DOMAIN_NAME`](../../configuration/env-variables/#domain_name) environment variable, in the **CONFIG** section of the docker-compose file.
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

1. [Stop](#start-stop) Mathesar if it is already running.
2. Manually upgrade Mathesar to the newest version:

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml up --force-recreate --build service
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml up --force-recreate --build service
        ```

3. Visit `localhost/connections` or `<your-mathesar-domain>/connections` to ensure that all your previous database connection(s) configured via `MATHESAR_DATABASES` environment variable show up in Mathesar.
4. Optionally remove the `MATHESAR_DATABASES` environment variable from your `.env` file.

!!! warning
    `MATHESAR_DATABASES` has been deprecated as of v0.1.4 and will be removed entirely in future releases of Mathesar. If you end up deleting the variable from your `.env` file before starting up mathesar after the upgrade, you can still add the connections manually through Mathesar's UI.
