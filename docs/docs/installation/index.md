# Install Mathesar

This page contains instructions to install Mathesar on various platforms.

## Guided installation using our install script
- Our install script guides you through a series of prompts to install Mathesar:
    ```sh
    bash <(curl -sfSL https://raw.githubusercontent.com/centerofci/mathesar/{{mathesar_version}}/install.sh)
    ```
- The script sets up Mathesar using Docker Compose and configures the admin user [under the hood](./guided-install/under-the-hood.md).
- [Detailed Guided Installation Instructions](./guided-install/index.md).
- !!! warning "Limitations"
    This is a convenient way to install Mathesar. However, it requires `sudo` privileges (admin access), and sets up a limited set of configuration options. Use the Docker Compose installation option below to exert more control.

## Docker Compose 
- Download our [docker-compose.yml](https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/docker-compose.yml) file.
    ```sh
    wget https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/docker-compose.yml
    ```
- Configure [environment variables](../configuration/env-variables.md).
    ```sh
    # Sample .env file
    wget https://github.com/centerofci/mathesar/raw/{{mathesar_version}}/.env.example
    mv .env.example .env
    ```
- Start Mathesar and create the super user.
    ```sh
    docker compose -f docker-compose.yml up -d
    docker exec -it mathesar_service python manage.py createsuperuser
    ```
- [Detailed Docker Compose Instructions](./docker-compose/index.md).

## Docker
- Use our [official Docker image](https://hub.docker.com/r/mathesar/mathesar-prod/tags): `mathesar/mathesar-prod:latest` hosted on Docker Hub to run Mathesar.
- [Instructions to run Mathesar on Docker](./docker/index.md)

## Build from source for Linux platforms
- You can install Mathesar on Linux platforms by building it from source.  
- [Instructions to build and run from source](./build-from-source/index.md)

---

!!! info "More installation methods coming soon"
    We [plan to support additional installation methods](https://github.com/centerofci/mathesar/issues/2509) in the near future.
