# Install Mathesar Webserver via Docker


## Prerequisites
!!! warning ""
    This installation procedure is intended for users who want to run a bare-bones version of the Mathesar web server. It is assumed you already have services like a reverse proxy needed for running a production server. To set up a proper production server, please refer to the [Docker Compose Installation Documentation](../docker-compose/index.md).

- You need [Docker](https://docs.docker.com/get-docker/)
    - We have tested with Docker v23. Older versions may not work.
- Permission to run Docker containers
- A Postgres database. Ensure the external database can accept network connections from your Mathesar server.
- Have the following information handy before installation:
    - Database hostname
    - Database port
    - Database name
    - Database username _(should exist and be a `SUPERUSER` [more info](https://www.postgresql.org/docs/13/sql-createrole.html))_
    - Database password

## Quickstart

- Use our [official Docker image](https://hub.docker.com/r/mathesar/mathesar-prod/tags): `mathesar/mathesar-prod:latest` hosted on Docker Hub to run Mathesar.

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
    
    The above command creates a docker container containing the Mathesar server running on the `localhost` and listening on port `8000`. It also:

    - Passes configuration options as environment variables to the docker container. Refer to [Configuring Mathesar web server](../../configuration/env-variables.md#backend) for setting the correct value to these configuration options and for additional configuration options. The configuration options used in the above command are:
        - `DJANGO_DATABASE_URL`
        - `DJANGO_DATABASE_KEY`
        - `MATHESAR_DATABASES`
        - `SECRET_KEY`
    - Creates two [named docker volumes](https://docs.docker.com/storage/volumes/)
        - `static` for storing static assets like CSS, js files
        - `media` for storing user-uploaded media files
    - Sets the container name as `mathesar_service` using the `--name` parameter, runs the container in a detached mode using the `--detach` parameter, and binds the port `8000` to the `localhost`. Refer to [Docker documentation](https://docs.docker.com/engine/reference/commandline/run/#options) for additional configuration options.

1. Verify if the Mathesar Server is running successfully:
    ```bash
    docker logs -f mathesar_service
    ```

1. Create a superuser
    ```bash
    docker exec -it mathesar_service python manage.py createsuperuser
    ```
    A prompt will appear to ask for the superuser details, fill in the details to create a superuser. At least one superuser is necessary for accessing Mathesar.

    See the Django docs for more information on the [`createsuperuser` command](https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser)

## Upgrade

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

## Uninstall

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