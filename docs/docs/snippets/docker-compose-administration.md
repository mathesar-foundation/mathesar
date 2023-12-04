## Uninstalling Mathesar {:#uninstall}
<!-- TODO: Remove this section and add in uninstall mathesar section -->

1. Remove all Mathesar Docker images and containers.

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml down --rmi all -v
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml down --rmi all -v
        ```

1. Remove configuration files.

    ```sh
    sudo rm -rf mathesar
    ```


{% include 'snippets/uninstall-schemas.md' %}