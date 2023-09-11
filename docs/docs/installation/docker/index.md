# Install Mathesar web server via Docker

Use our [official Docker image](https://hub.docker.com/r/mathesar/mathesar-prod/tags): `mathesar/mathesar-prod:latest` hosted on Docker Hub to run Mathesar.

!!! warning "Limitations"
    This installation procedure is intended for users who want to run a bare-bones version of the Mathesar web server.

    It is assumed you already have a database server and services like a reverse proxy typically needed for running a production setup. If you don't have those, please use the [Docker Compose installation documentation](../docker-compose/index.md).


## Prerequisites

### Operating System
You can install Mathesar using this method on Linux, MacOS, and Windows.

### Access
You should have permission to run Docker containers on the system.

### Software
You'll need to install **[Docker](https://docs.docker.com/desktop/)** v23+

### Databases

#### Database for Mathesar's internal usage
You'll need to:

- Create a PostgreSQL database for Mathesar's internal usage.
- Create a database user for Mathesar to use. The user should be a `SUPERUSER`, [see PostgreSQL docs for more information](https://www.postgresql.org/docs/13/sql-createrole.html).
- Ensure that this database can accept network connections from the machine you're installing Mathesar on.
- Have the following information for this database handy before installation:
    - Database hostname
    - Database port
    - Database name
    - Database username
    - Database password

#### Databases connected to Mathesar's UI
Have the following information for all databases you'd like to connect to Mathesar's UI before installation:

- Database hostname
- Database port
- Database name
- Database username (should be a `SUPERUSER`, see above)
- Database password

!!! warning "Database creation"
    Whenever the Docker container is started, we will attempt to create any databases in this list that don't already exist. So you don't need to ensure that they are created before installation.

## Installation Steps

1. Run the Mathesar Docker Image

    ```bash
    docker run \
      --detach
      -e DJANGO_DATABASE_URL='<replace with a postgres connection string>' \
      -e MATHESAR_DATABASES='(<unique_db_key>|<replace with a postgres connection array>)' \
      -e SECRET_KEY='<replace with a 50 character string>' \
      -e ALLOWED_HOSTS='.localhost, 127.0.0.1, [::1]' \
      -v static:/code/static \
      -v media:/code/media \
      --name mathesar_service \
      -p 8000:8000 \
      --restart unless-stopped \
      mathesar/mathesar-prod:latest
    ```
    
    The above command creates a Docker container containing the Mathesar server running on the `localhost` and listening on port `8000`. It also:

    - Passes configuration options as environment variables to the Docker container. Refer to [Configuring Mathesar web server](../../configuration/env-variables.md#backend) for setting the correct value to these configuration options and for additional configuration options. The configuration options used in the above command are:
        - `DJANGO_DATABASE_URL`
        - `DJANGO_DATABASE_KEY`
        - `MATHESAR_DATABASES`
        - `SECRET_KEY`
    - Creates two [named Docker volumes](https://docs.docker.com/storage/volumes/)
        - `static` for storing static assets like CSS, js files
        - `media` for storing user-uploaded media files
    - Sets the container name as `mathesar_service` using the `--name` parameter, runs the container in a detached mode using the `--detach` parameter, and binds the port `8000` to the `localhost`. Refer to [Docker documentation](https://docs.docker.com/engine/reference/commandline/run/#options) for additional configuration options.

1. Verify if the Mathesar server is running successfully:
    ```bash
    docker logs -f mathesar_service
    ```

1. Set up your user account

    Mathesar is now installed! You can use it by visiting `localhost` or the domain you've set up.

    You'll be prompted to set up an admin user account the first time you open Mathesar. Just follow the instructions on screen.

## Upgrading Mathesar {:#upgrade}

1. Stop your existing Mathesar container:

    ```bash
    docker stop mathesar_service
    ```

1. Remove the old Mathesar Image
    ```bash
    docker rm mathesar_service
    ```

1. Bump the image version in the `docker run` command you usually use to run your
   Mathesar and start up a brand-new container:

    ```bash
    docker run \
      -d \
      --name mathesar_service \
      # YOUR STANDARD ARGS HERE
      mathesar/mathesar-prod:latest
    ```

## Uninstalling Mathesar {:#uninstall}

1. Remove the Mathesar container.

    ```bash
    docker rm -v mathesar_service
    ```

1. Remove the Mathesar Image

    ```bash
    docker rmi mathesar_service
    ```

1. Remove volumes related to Mathesar

    ```bash
    docker volume rm static &&
    docker volume rm media
    ```

{% include 'snippets/uninstall-schemas.md' %}
