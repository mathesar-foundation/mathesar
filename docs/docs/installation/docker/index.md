# Install Mathesar via Docker

Use our [official Docker image](https://hub.docker.com/r/mathesar/mathesar-prod/tags): `mathesar/mathesar-prod:latest` hosted on Docker Hub to run Mathesar.

- You need [Docker](https://docs.docker.com/get-docker/).
    - We have tested with Docker v23. Older versions may not work.
- You need permission to run Docker containers.


## Installation Steps

1. Run the Mathesar Docker Image

    ```bash
    docker run \
      --detach \
      -v static:/code/static \
      -v media:/code/media \
      --name mathesar_service \
      -p 8000:8000 \
      --restart unless-stopped \
      mathesar/mathesar-prod:latest
    ```

    The above command creates a docker container containing the Mathesar server running on the `localhost` and listening on port `8000`. It also:

    - Creates two [named docker volumes](https://docs.docker.com/storage/volumes/)
        - `static` for storing static assets like CSS, js files
        - `media` for storing user-uploaded media files
    - Sets the container name as `mathesar_service` using the `--name` parameter, runs the container in a detached mode using the `--detach` parameter, and binds the port `8000` to the `localhost`. Refer to [Docker documentation](https://docs.docker.com/engine/reference/commandline/run/#options) for additional configuration options.

1. Verify if the Mathesar server is running successfully:
    ```bash
    docker logs -f mathesar_service
    ```

    !!! warning
        If you are testing Mathesar on a local machine, you can go to the next step for setting up Mathesar. But if you are hosting on a server or looking for a production setup, please take a look at [additional configurations](#configuration) before setting up Mathesar.

1. Set up your user account

    Mathesar is now installed! You can use it by visiting `http://localhost:8000` or the domain you've set up.

    You'll be prompted to set up an admin user account and add user database credentials the first time you open Mathesar. Just follow the instructions on screen.


## Configuring Mathesar {:#configuration}

### Using a domain name {:#domain-name}

If you are accessing Mathesar using a domain name, you need to add it to the list of domains Mathesar can accept requests from. This can be accomplished by setting the [ALLOWED_HOSTS](../../configuration/env-variables.md#allowed_hosts) environment variable

```bash
docker run \
  -e ALLOWED_HOSTS='mathesar.example.com' \
  # OTHER ARGS HERE
  mathesar/mathesar-prod:latest
```

### Hosting on default port 80

The command used in the Quickstart section will run Mathesar on port 8000, so you will have to access it on `http://<domain-name>:8000`. If you wish to access Mathesar without adding any port suffix like `http://<domain-name>`, you need to bind it to port 80

```bash
docker run \
  -p 80:8000 \
  # OTHER ARGS HERE
  mathesar/mathesar-prod:latest
```

### Using a remote Postgres server for the internal database

!!! info
    We strongly recommend using this setup for stateless deployments when scaling horizontally, because by default the data is stored in the same server on which Mathesar is running. This data will be lost if the server is deleted.

The docker image contains a Postgres server which is used by default. If you want Mathesar to use a remote database as its internal database for storing its metadata, you need to set the remote database credentials to the [DJANGO_DATABASE_URL](../../configuration/env-variables.md#dj_db) environment variable.

```bash
docker run \
  -e DJANGO_DATABASE='postgres://user:password@hostname:port/database_name' \
  # OTHER ARGS HERE
  mathesar/mathesar-prod:latest
```

### Using a custom secret key

By default, the docker image uses a default secret key. The default key should only be used when testing and is not recommended when exposing Mathesar to the outside world. 

- Refer to the [SECRET_KEY](../../configuration/env-variables.md#secret_key) for information on how to get your own secret key.
- Pass the key as an environment variable to the docker image.

```bash
docker run \
  -e SECRET_KEY='<replace with a random 50 character string>' \
  # OTHER ARGS HERE
  mathesar/mathesar-prod:latest
```

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


## Troubleshooting

### 400 Bad request 

If you are getting `400 (Bad request)` when visting Mathesar using a domain name or an IP address, it might be happening due to the domain name not whitelisted correctly. Please follow the instructions for [accessing using a domain name](#configuration),