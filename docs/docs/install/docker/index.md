# Install Mathesar via Docker Compose



## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) v23
- Permission to run Docker containers
- A Postgres database. Ensure the external database can accept network connections from your Mathesar server.
- Have the following information handy before installation:
    - Database hostname _(cannot [yet](https://github.com/centerofci/mathesar/issues/2571) be `localhost`)_
    - Database port
    - Database name
    - Database username _(should exist and be a `SUPERUSER` [more info](https://www.postgresql.org/docs/13/sql-createrole.html))_
    - Database password

## Installation Steps

### Step 1. Run the Mathesar Docker Image
```bash
docker create \
  -e DJANGO_DATABASE_URL='<replace with a postgres connection string>' \
  -e DJANGO_DATABASE_KEY='default' \
  -e MATHESAR_DATABASES='<replace with a postgres connection array>' \
  -e SECRET_KEY='<replace with a 50 character string>' \
  -v static:/code/static \
  -v media:/code/media \
  --name mathesar_service \
  -p 8000:8000 \
  --restart unless-stopped \
  mathesar/mathesar-prod:latest
```
The above command starts a docker container containing the Mathesar server running on the `localhost`, listening on port `8000` and additionally
- Passes configuration options as environment variables to the docker container. Refer to [Configuring Mathesar](https://docs.docker.com/engine/reference/commandline/run/#options) for setting the correct value to these configuration options and for additional configuration option. The configuration options used in the above command are
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
Step 2. Verify if the Mathesar Server is running successfully:
```bash
docker logs -f mathesar_service
```
### Step 3. Install Mathesar on the user database
```bash
# Install Mathesar types and casting function on the databases specified using the `MATHESAR_DATABASES` env variable in the previous step
docker exec mathesar_service python install.py --skip-confirm
```

### Step 4. Create a superuser
```bash
# Run the Django `createsuperuser` command. Refer https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser
docker exec -it mathesar_service python manage.py createsuperuser
```


## Upgrading from a previous version

1. Stop your existing Mathesar container:

```bash
docker stop mathesar_service
```

2. Bump the image version in the `docker run` command you usually use to run your
   Mathesar and start up a brand-new container:

```bash

    docker create \
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
