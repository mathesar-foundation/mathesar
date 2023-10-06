# Uninstall Mathesar

The uninstall instructions vary depending on the [installation method](../index.md#installing-mathesar) you chose. Select your installation method below to proceed.

- [Uninstall a **Docker compose** installation of Mathesar](../installation/docker-compose/index.md#uninstall)
- [Uninstall a **Docker** installation of Mathesar](../installation/docker/index.md#uninstall)

## (uninstall, when installed from guided install, or docker compose)

<!-- TODO: add content -->


## (uninstall, when installed from source)

<!-- TODO rename heading, re-organize content, review -->

1. Stop Caddy service

    ```sh
    sudo systemctl disable caddy.service && sudo systemctl stop caddy.service
    ```

1. Remove Caddy service file and Caddyfile

    ```sh
    sudo rm /lib/systemd/system/caddy.service && sudo rm /etc/caddy/Caddyfile
    ```

1. Stop Gunicorn

    ```sh
    sudo systemctl disable gunicorn.service && sudo systemctl stop gunicorn.service
    ```

1. Remove Gunicorn service file

    ```sh
    sudo rm /lib/systemd/system/gunicorn.service
    ```

1. Remove your Mathesar installation directory

    ```sh
    sudo rm -r xMATHESAR_INSTALLATION_DIRx
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
