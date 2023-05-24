# Guided Installation using our Install Script

## Prerequisites

{% include 'snippets/docker-compose-prerequisites.md' %}

## Installation Steps {: #steps}

!!! info "Install Script Overview"
    This is a convenient way to install Mathesar, but it is highly opinionated and needs `sudo` privileges (admin access). Although it provides certain configuration options, it might not be suitable if you want to modify the installed services or customize your installation. Use the [Docker Compose installation](../docker-compose/index.md) method if you'd like more control.
    
    The installation script will set up:

    - A Postgres database server to store data
    - A web server to run the Mathesar application
    - A reverse proxy server to serve static files and set up SSL certificates
    - An upgrade server to handle upgrading Mathesar via the web interface

    If you'd like to know the steps performed by the install script in more detail, you can read our [Guided Installation Script, Under the Hood](./under-the-hood.md) document.

1. Paste this command into your terminal to begin installing the latest version of Mathesar:

    ```sh
    bash <(curl -sfSL https://raw.githubusercontent.com/centerofci/mathesar/0.1.1/install.sh)
    ```

1. Follow the interactive prompts to configure your Mathesar installation.

1. When finished, the installer will display the URL where you can run Mathesar from your web browser.

!!! note "Connecting to an existing database"
    Once you have successfully installed Mathesar, if you wish to connect it to an existing database , you can refer the instructions [here](../../configuration/connect-to-existing-db.md).

!!! info "Getting help"
    If you run into any problems during installation, see [troubleshooting](./troubleshooting.md) or [open a ticket describing your problem](https://github.com/centerofci/mathesar/issues/new/choose).

{% include 'snippets/docker-compose-administration.md' %}
