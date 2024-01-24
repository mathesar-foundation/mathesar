# Install Mathesar via Docker image

Use our [official Docker image](https://hub.docker.com/r/mathesar/mathesar-prod/tags): `mathesar/mathesar-prod:latest` hosted on Docker Hub to run Mathesar.

## Prerequisites

- You need Linux, MacOS, or Windows.
- You need to install **[Docker](https://docs.docker.com/get-docker/)**.

    (We have tested with Docker v23. Older versions may not work.)

- You need permission to run Docker containers. You can verify this by running:

    ```
    docker ps
    ```

    !!! info "Docker may require elevated privileges"
        Some Docker installations require all `docker` commands to run as root. If you encounter "permission denied" errors, replace `docker` with `sudo docker`.

## Installation

1. Go to a directory where you will store your Mathesar configuration. For example:

    ```
    mkdir -p ~/mathesar
    cd ~/mathesar
    ```

1. Create a minimal Mathesar [configuration](../../configuration/env-variables.md) file.

    === "Linux and MacOS"
        ```
        echo SECRET_KEY=$(
          cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | head -c 50
        ) > mathesar.env
        ```

        This command generates a random [SECRET_KEY](../../configuration/env-variables.md#secret_key) configuration variable, as necessary for Mathesar's security.
    
    === "Windows"
        1. Create a new file named `mathesar.env`.

        1. Set its contents to

            ```
            SECRET_KEY=replace_this_with_a_random_string
            ```

        1. Change the [SECRET_KEY](../../configuration/env-variables.md#secret_key) value to be a random string. You can generate one using [this website](https://djecrety.ir/).


1. Run the Mathesar Docker image.

    ```
    docker run \
      --detach \
      -v static:/code/static \
      -v media:/code/media \
      -v postgresql_config:/etc/postgresql/ \
      -v postgresql_data:/var/lib/postgresql/ \
      --name mathesar_service \
      -p 8000:8000 \
      --env-file mathesar.env \
      --restart unless-stopped \
      mathesar/mathesar-prod:latest
    ```

    ??? info "Command options explained"

        - `--detach` runs the container in [detached mode](https://docs.docker.com/engine/reference/commandline/container_run/#detach) i.e. in the background.
        - The `-v` options create four [named Docker volumes](https://docs.docker.com/storage/volumes/):
            - `static` for storing static assets like CSS, js files
            - `media` for storing user-uploaded media files
            - `postgresql_config` for storing database config related files
            - `postgresql_data` for storing database related files
        - `--name` sets the [container name](https://docs.docker.com/engine/reference/commandline/container_run/#name) as `mathesar_service`.
        - `-p` [binds](https://docs.docker.com/engine/reference/commandline/container_run/#publish) the port `8000` to `localhost` on the host machine.
        - `--env-file` passes your configuration to the container.
        - `--restart` adjust the [restart policy](https://docs.docker.com/engine/reference/commandline/container_run/#restart) to help keep Mathesar up.
        
        Many [additional options](https://docs.docker.com/engine/reference/commandline/run/#options) are available too.

1. Visit [http://localhost:8000/](http://localhost:8000/) to set up an admin user account and create a database connection.

Now you should have a running Mathesar installation connected to a PostgreSQL database!

## Administration

### Connecting to the PostgreSQL server within Docker {:#psql}

TODO

### Viewing logs {:#logs}

```
docker logs -f mathesar_service
```

### Shutting down {:#shut-down}

```
docker stop mathesar_service
```

### Starting up again {:#restart}

```
docker start mathesar_service
```

### Making backups {:#backups}

TODO

### Modifying Docker container metadata {:#container-metadata}

TODO

### Upgrading {:#upgrade}

1. Stop your existing Mathesar container:

    ```
    docker stop mathesar_service
    ```

1. Remove the old Mathesar image
    ```
    docker rm mathesar_service
    ```

1. Run the `docker run` command you usually use to run your Mathesar and start up a brand-new container:

    <!-- TODO how does the user know what command they "usually use" if we've not told them to store this anywhere? -->
    
    ```
    docker run \
      -d \
      --name mathesar_service \
      # YOUR STANDARD ARGS HERE
      mathesar/mathesar-prod:latest
    ```

### Uninstalling {:#uninstall}

1. Remove the Mathesar container.

    ```
    docker rm -v mathesar_service
    ```

1. Remove the Mathesar Image

    ```
    docker rmi mathesar_service
    ```

1. Remove volumes related to Mathesar

    ```
    docker volume rm static &&
    docker volume rm media
    ```

{% include 'snippets/uninstall-schemas.md' %}

## Making it production-ready {:#production}

<!-- TODO finish converting this content from "reference" style to "guide" style -->

1. Move your docker volumes.

    TODO

1. Set up your custom domain name.

    If you are accessing Mathesar using a custom domain name, you need to add it to the list of domains Mathesar can accept requests from. This can be accomplished by setting the [ALLOWED_HOSTS](../../configuration/env-variables.md#allowed_hosts) environment variable

    ```
    docker run \
      -e ALLOWED_HOSTS='mathesar.example.com' \
      # OTHER ARGS HERE
      mathesar/mathesar-prod:latest
    ```

1. Use default port 80 

    The command used in the quick start section will run Mathesar on port 8000, so you will have to access it on `http://<domain-name>:8000`. If you wish to access Mathesar without adding any port suffix like `http://<domain-name>`, you need to bind it to port 80 as follows:

    ```
    docker run \
      -p 80:8000 \
      # OTHER ARGS HERE
      mathesar/mathesar-prod:latest
    ```

1. Consider moving your data to a managed PostgreSQL server.

    TODO

1. Consider storing Mathesar's metadata in a remote Postgres server {:#remote-internal-db}

    TODO clean up this language

    !!! info
        We strongly recommend using this setup for stateless deployments when scaling horizontally, because by default the data is stored in the same server on which Mathesar is running. This data will be lost if the server is deleted.

    The docker image contains a Postgres server which is used by default. If you want Mathesar to use a remote database as its internal database for storing its metadata, you need to set the remote database credentials to the [Internal database environment variables](../../configuration/env-variables.md#db).

    ```
    docker run \
      -e POSTGRES_DB=database_name \
      -e POSTGRES_USER=user \
      -e POSTGRES_PASSWORD=pass \
      -e POSTGRES_HOST=hostname \
      -e POSTGRES_PORT=port \
      # OTHER ARGS HERE
      mathesar/mathesar-prod:latest
    ```

## Troubleshooting

If you are having trouble installing or using Mathesar, we'd like to hear from you! [Contact us](https://mathesar.org/free-install.html) for help.

### "Permission denied" errors

When running a docker command, you might see an error like this:

> permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json": dial unix /var/run/docker.sock: connect: permission denied

This is a sign that your Docker installation might require root privileges. (This is common.) Try running the same command again but with `sudo` in front. If it works, then remember to prefix _all_ Docker commands with `sudo`.

### 400 Bad request 

If you are getting `400 (Bad request)` when visiting Mathesar using a domain name or an IP address, it might be happening due to the domain name not being correctly whitelisted. Follow the instructions for [accessing using a domain name](#domain-name).
