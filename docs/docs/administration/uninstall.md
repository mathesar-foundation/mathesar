# Uninstall Mathesar

The uninstall instructions vary depending on the [installation method](../index.md#installing-mathesar) you chose. Select your installation method below to proceed.

## Uninstall a Docker installation of Mathesar

!!!note
    Depending on your Docker setup, you may need to run `docker` commands with `sudo`.

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


## Uninstall a guided script or Docker compose installation of Mathesar

1. Remove all Mathesar Docker images and containers.

    ```
    docker compose -f docker-compose.yml down --rmi all -v
    ```

1. Remove configuration files.

    ```
    rm -rf xMATHESAR_INSTALLATION_DIRx  # may need sudo, depending on location
    ```

{% include 'snippets/uninstall-schemas.md' %}

## Uninstall a source installation of Mathesar

1. Stop Caddy service

    ```
    systemctl disable caddy.service && systemctl stop caddy.service
    ```

1. Remove Caddy service file and Caddyfile (requires `sudo`)

    ```
    sudo rm /lib/systemd/system/caddy.service
    sudo rm /etc/caddy/Caddyfile
    ```

1. Stop Gunicorn

    ```
    systemctl disable gunicorn.service
    systemctl stop gunicorn.service
    ```

1. Remove Gunicorn service file

    ```
    sudo rm /lib/systemd/system/gunicorn.service
    ```

1. Remove your Mathesar installation directory

    ```
    rm -r xMATHESAR_INSTALLATION_DIRx  # May need sudo, depending on location
    ```

    !!! warning "Your installation directory might be customized"
        It's possible that Mathesar could have been installed into a different directory than shown above. Use caution when deleting this directory.

1. Remove Django database

    1. Connect to the psql terminal.

        ```
        sudo -u postgres psql
        ```
    
    2. Drop the Django database.

        ```postgresql
        DROP DATABASE mathesar_django;
        ```

{% include 'snippets/uninstall-schemas.md' %}
