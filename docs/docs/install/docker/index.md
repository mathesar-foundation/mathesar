# Install Mathesar via Docker


## Prerequisites
!!! warning ""
    This installation procedure is intended for users who want to run a bare-bones version of the Mathesar Webserver. It is assumed you already have services like a reverse proxy needed for running a production server. Please look at [Docker Compose Installation Documentation](../docker-compose/index.md) for running services needed for a proper production server 

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

## Installation Steps

1. Run the Mathesar Docker Image
    ```bash
    docker run \
      --detach
      -e DJANGO_DATABASE_URL='<replace with a postgres connection string>' \
      -e DJANGO_DATABASE_KEY='default' \
      -e MATHESAR_DATABASES='(<unique_db_key>|<replace with a postgres connection array>)' \
      -e SECRET_KEY='<replace with a 50 character string>' \
      -e ALLOWED_HOSTS='.localhost, 127.0.0.1, [::1]' \
      -e DJANGO_SETTINGS_MODULE='config.settings.production' \
      -v static:/code/static \
      -v media:/code/media \
      --name mathesar_service \
      -p 8000:8000 \
      --restart unless-stopped \
      --entrypoint ./run.sh \
      mathesar/mathesar-prod:latest
    ```
      The above command creates a docker container containing the Mathesar server running on the `localhost`,
     listening on port `8000` and additionally
     - Passes configuration options as environment variables to the docker container. Refer to [Configuring Mathesar webserver](../configuration.md#backend-configuration) for setting the correct value to these configuration options and for additional configuration option. The configuration options used in the above command are
       - DJANGO_DATABASE_URL
       - DJANGO_DATABASE_KEY
       - MATHESAR_DATABASES
       - SECRET_KEY
       - Creates two [named docker volumes](https://docs.docker.com/storage/volumes/)
          ```
               - static # For storing static assets like css, js files
               - media # For storing user uploaded media files
          ```
       - Sets the container name as `mathesar_service` using the `--name` parameter, runs the container in a detached mode using `--detach` parameter and exposes the port `8000` to the `localhost`. Refer to [Docker documentation](https://docs.docker.com/engine/reference/commandline/run/#options) for additional configuration options.
       - Finally, sets the container entrypoint to run the script `run.sh` which starts a gunicorn server on the port `8000`

2. Verify if the Mathesar Server is running successfully:
    ```bash
    docker logs -f mathesar_service
    ```

3. Run Mathesar Installation script
    ```bash
    # Install Mathesar types and casting function on the databases specified using the `MATHESAR_DATABASES` env variable in the previous step, run database migrations on the Django meta database,  store the static files in the `static` volumes.
    docker exec mathesar_service python install.py --skip-confirm
    ```

4. Create a superuser
    ```bash
    # Run the Django `createsuperuser` command. Refer https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser
    docker exec -it mathesar_service python manage.py createsuperuser
    ```
    A prompt will appear to ask for the superuser details, fill in the details to create a superuser. At least one superuser is necessary for accessing Mathesar.

## Frequently Asked Questions

#### Upgrading from a previous version

1. Stop your existing Mathesar container:

    ```bash
    docker stop mathesar_service
    ```

2. Bump the image version in the `docker run` command you usually use to run your
   Mathesar and start up a brand-new container:

    ```bash
    
        docker run \
          -d \
          # We haven't yet deleted the old Mathesar container so you need to start this new one
          # with a different name to prevent an error like:
          # `response from daemon: Conflict. The container name "/mathesar_service" is already in use` 
          --name mathesar_service_version_REPLACE_WITH_NEW_VERSION \
          # YOUR STANDARD ARGS HERE
          mathesar/mathesar-prod:REPLACE_WITH_LATEST_VERSION
    ```

3. Update Mathesar types installed on the Database

    ```bash
    docker exec mathesar_service python install.py --skip-confirm
    ```

4. Remove the old Mathesar Image
    ```bash
   docker rm mathesar_service
    ```