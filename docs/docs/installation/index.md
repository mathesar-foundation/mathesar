# Install Mathesar

This page contains instructions to install Mathesar on various platforms.

## Guided installation using our interactive script
- Use our interactive script to automically download the required docker-compose.yml file and setup environment variables via a series of prompts.
    ```sh
    bash <(curl -sfSL https://raw.githubusercontent.com/centerofci/mathesar/0.1.1/install.sh)
    ```
- !!! warning "Limitations"
    This is a fast and convenient way to install Mathesar. However, it requires `sudo` privileges (admin access), and provides a limited set of configuration options. Use the Manual Install option to exert more control.
- [Read detailed instructions](./guided-install/index.md)

## Docker compose 
- Download our docker-compose.yml file, and configure environment variables on your own.
    ```sh
    wget https://github.com/centerofci/mathesar/raw/master/docker-compose.yml
    ```
- [Read detailed instructions](./docker-compose/index.md)

## Docker
- You can use our official Docker image hosted on Docker Hub to run Mathesar: `mathesar/mathesar-prod:latest`.
- [Run Mathesar on Docker](./docker/index.md)

## Build from source for Linux platforms
- You can install Mathesar on Linux platforms by building it from source.  
- [Build from source]()

---

!!! info "More installation methods coming soon"
    We [plan to support additional installation methods](https://github.com/centerofci/mathesar/issues/2509) in the near future.
