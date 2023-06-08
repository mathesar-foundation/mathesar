# Guided installation

Our install script guides you through a series of prompts to install Mathesar. The script sets up Mathesar using Docker Compose [under the hood](./under-the-hood.md).

!!! warning "Limitations"
    This is a convenient way to install Mathesar. However, it's highly opinionated and requires `sudo` privileges (admin access), and only supports a limited set of configuration options. Use the [Docker Compose installation option](../docker-compose/) if you'd like to customize your installation.

## Prerequisites

{% include 'snippets/docker-compose-prerequisites.md' %}


## Overview

The installation script will set up:

- A Postgres database server to store data
- A web server to run the Mathesar application
- A reverse proxy server to serve static files and set up SSL certificates
- An upgrade server to handle upgrading Mathesar via the web interface

If you'd like to know the steps performed by the install script in more detail, you can read our [Guided installation: under the hood](./under-the-hood.md) document.

## Step-by-step guide {: #steps}

!!! info "Getting help"
    If you run into any problems during installation, see [our troubleshooting guide](./troubleshooting.md) or [open a ticket describing your problem](https://github.com/centerofci/mathesar/issues/new/choose).

1. Paste this command into your terminal to begin installing the latest version of Mathesar:

    ```sh
    bash <(curl -sfSL https://raw.githubusercontent.com/centerofci/mathesar/{{mathesar_version}}/install.sh)
    ```

1. Follow the interactive prompts to configure your Mathesar installation.

1. When finished, the installer will display the URL where you can run Mathesar from your web browser.

!!! note "Connecting to additional databases"
    Once you have successfully installed Mathesar, if you wish to connect an additional database to Mathesar, [instructions are here](../../configuration/connect-to-existing-db.md).



{% include 'snippets/docker-compose-administration.md' %}
