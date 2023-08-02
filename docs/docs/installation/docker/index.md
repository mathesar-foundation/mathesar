# Install Mathesar web server via Docker

Use our [official Docker image](https://hub.docker.com/r/mathesar/mathesar-prod/tags): `mathesar/mathesar-prod:latest` hosted on Docker Hub to run Mathesar.

!!! warning "Limitations"
    This installation procedure is intended for users who want to quickly run Mathesar on their local machine without exposing it to the internet.

    Please use the [Docker Compose installation documentation](../docker-compose/index.md) if you plan to expose Mathesar to the internet. We will be adding information setting up a production server to this documentation in [our next release](https://github.com/centerofci/mathesar/issues/3122)


## Prerequisites

### Operating System
You can install Mathesar using this method on Linux, MacOS, and Windows.

### Access
You should have permission to run Docker containers on the system.

### Software
You'll need to install **[Docker](https://docs.docker.com/desktop/)** v23+

## Installation Steps

1. Run the Mathesar Docker Image

    ```bash
    docker run \
      --detach
      -e SECRET_KEY='<replace with a 50 character string>' \
      -e ALLOWED_HOSTS='.localhost, 127.0.0.1, [::1]' \
      -v static:/code/static \
      -v media:/code/media \
      -v postgresql_data:/var/lib/postgresql/data \
      --name mathesar_service \
      -p 8000:8000 \
      --restart unless-stopped \
      mathesar/mathesar-prod:latest
    ```
    
    The above command creates a Docker container containing the Mathesar server running on the `localhost` and listening on port `8000`. It also:

    - Creates three [named Docker volumes](https://docs.docker.com/storage/volumes/)
        - `static` for storing static assets like CSS, js files
        - `media` for storing user-uploaded media files
        - `postgresql_data` for storing database related files
    - Sets the container name as `mathesar_service` using the `--name` parameter, runs the container in a detached mode using the `--detach` parameter, and binds the port `8000` to the `localhost`. Refer to [Docker documentation](https://docs.docker.com/engine/reference/commandline/run/#options) for additional configuration options.

1. Verify if the Mathesar server is running successfully:
    ```bash
    docker logs -f mathesar_service
    ```

1. Create a superuser
    ```bash
    docker exec -it mathesar_service python manage.py createsuperuser
    ```
    A prompt will appear to ask for the superuser details, fill in the details to create a superuser. At least one superuser is necessary for accessing Mathesar.

    See the Django docs for more information on the [`createsuperuser` command](https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser)


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
