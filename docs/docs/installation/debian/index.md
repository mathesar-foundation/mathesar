# Install Mathesar via Docker

Use our [Debian package](https://hub.docker.com/r/mathesar/mathesar-prod/tags): `mathesar` hosted to run Mathesar.

## Prerequisites

### Operating System

<!-- TODO: clean up language  -->

You can install Mathesar using this method on the following Debian versions

- Debian 11 (Bullseye)

We will be adding support for other versions of Debian in our future release

### Access

You should have permission to install a debian package


## Installation Steps

<!-- TODO: replace with correct repo URL once assiged by OpenSuse, improve formatting of code block -->

1. Add keys to apt repository.

    ```
    echo 'deb http://download.opensuse.org/repositories/mathesar/Debian_11/ /' | sudo tee /etc/apt/sources.list.d/mathesar.list
    curl -fsSL https://download.opensuse.org/repositories/mathesar/Debian_11/Release.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/mathesar.gpg > /dev/null
    ```

1. Install Mathesar package.

    ```
    sudo apt install mathesar
    ```

    The above command starts a [systemd service](https://systemd.io/) running on the Mathesar server on `localhost` and listening on port `8000`.


1. Verify if the Mathesar server is running successfully:

    ```bash
    sudo systemctl status mathesar
    ```

    <!-- TODO lift this out of a warning and into an actual step -->

    !!! warning
        If you are testing Mathesar on a local machine, you can go to the next step for setting up Mathesar. But if you are hosting on a server or looking for a production setup, please take a look at [additional configurations](#configuration) before setting up Mathesar.

1. Set up your user account

    Mathesar is now installed! You can use it by visiting `http://localhost:8000` or the domain you've set up.

    You'll be prompted to set up an admin user account and add user database credentials the first time you open Mathesar. Just follow the instructions on screen.


## Configuring Mathesar {:#configuration}

### Using a domain name {:#domain-name}

If you are accessing Mathesar using a domain name, you need to add it to the list of domains Mathesar can accept requests from. This can be accomplished by setting the [ALLOWED_HOSTS](../../configuration/env-variables.md#allowed_hosts) environment variable in the config file

1. Edit the config file

    ```sh
    sudo nano /etc/mathesar/.env
    ```


1. Set the domain name to the [ALLOWED_HOSTS](../../configuration/env-variables.md#allowed_hosts) config variable in config file:

    !!! example
        Your `.env` file should look something like this
        
        ``` bash
        ALLOWED_HOSTS='<DOMAIN_NAME_HERE>'
        # Other env variables
        ```


### Hosting on default port 80

Mathesar service runs on port 8000, so you will have to access it on `http://<domain-name>:8000`. If you wish to access Mathesar without adding any port suffix like `http://<domain-name>`, you need to have a reverse proxy like Nginx or Caddy listen on port 80 and redirect traffic to port 8000. 

!!! info
    Although we recommend using a reverse proxy to redirect traffic to port 8000, for testing purpose you can use the following command to redirect traffic without any additional software.
    ```
    sudo socat tcp-listen:80,reuseaddr,fork tcp:localhost:8000
    ```


### Using a remote Postgres server for the internal database

!!! info
    We strongly recommend using this setup for stateless deployments when scaling horizontally, because by default, the data is stored in the same server on which Mathesar is running. This data will be lost if the server is deleted.

By default, the internal data is stored in a SQLite database. If you want Mathesar to use a remote database as its internal database for storing its metadata, you need to set the remote database credentials to the [DJANGO_DATABASE_URL](../../configuration/env-variables.md#dj_db) environment variable.


1. Edit the config file

    ```sh
    sudo nano /etc/mathesar/.env
    ```


2. Set the domain name to the [ALLOWED_HOSTS](../../configuration/env-variables.md#allowed_hosts) config variable in config file:

!!! example
    Your `.env` file should look something like this
    
    ``` bash
    DJANGO_DATABASE='postgres://user:password@hostname:port/database_name'
    # Other env variables
    ```

### Using a custom secret key

!!! info
     If scaling horizontally, you need to make sure the [SECRET_KEY](../../configuration/env-variables.md#secret_key) is same across all the instances. Setting your own custom key which is same across all the machines instead of the randomly generated default is useful in such cases.

    1. Edit the config file

        ```sh
        sudo nano /etc/mathesar/.env
        ```


    2. Set the value of the [SECRET_KEY](../../configuration/env-variables.md#secret_key) to your own custom key:

        !!! example
            Your `.env` file should look something like this
            
            ``` bash
            SECRET_KEY='<replace with a random 50 character string>
            # Other env variables
            ```

## Upgrading Mathesar {:#upgrade}

```
sudo apt update
sudo apt upgrade mathesar
```

## Uninstalling Mathesar {:#uninstall}

1. Remove the Mathesar package.

    ```bash
    sudo apt remove mathesar
    ```


{% include 'snippets/uninstall-schemas.md' %}


## Troubleshooting

### 400 Bad request 

If you are getting `400 (Bad request)` when visting Mathesar using a domain name or an IP address, it might be happening due to the domain name not whitelisted correctly. Please follow the instructions for [accessing using a domain name](#configuration).