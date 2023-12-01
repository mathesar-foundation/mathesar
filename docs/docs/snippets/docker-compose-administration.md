## Starting and stopping Mathesar {:#start-stop}

The Mathesar server needs to be running for you to use Mathesar. If you restart your machine, you'll need to start the server again.

- **Start** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml up -d
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml up -d
        ```
    !!! Info
        Exclude the `-d` flag if you'd like to see the container's logs.

- **Stop** Mathesar:

    === "Linux"
        ```
        sudo docker compose -f docker-compose.yml down
        ```

    === "MacOS"
        ```
        docker compose -f docker-compose.yml down
        ```

    This stops all Mathesar Docker containers and releases their ports.


## Upgrading Mathesar {:#upgrade}
<!-- TODO: fix this -->
!!! tip "Upgrade from within Mathesar"
    You can also run the upgrade from within Mathesar by logging in as an admin user and navigating to "Administration" (in the top right menu) > "Software Update"

Manually upgrade Mathesar to the newest version using Watchtower:

=== "Linux"
    ```
    sudo docker exec mathesar-watchtower-1 /watchtower --run-once
    ```

=== "MacOS"
    ```
    docker exec mathesar-watchtower-1 /watchtower --run-once
    ```

Manually upgrade Mathesar to the newest version without using Watchtower:

=== "Linux"
    ```
    sudo docker compose -f docker-compose.yml up --force-recreate --build service
    ```

=== "MacOS"
    ```
    docker compose -f docker-compose.yml up --force-recreate --build service
    ```

## Uninstalling Mathesar {:#uninstall}
<!-- TODO: Check if this works -->

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