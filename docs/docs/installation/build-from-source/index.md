# Install Mathesar from source on Linux

!!! warning "For experienced Linux sysadmins"
    To follow this guide you need be experienced with Linux server administration, including the command line interface and some common utilities.

    If you run into any trouble, we encourage you to [open an issue](https://github.com/mathesar-foundation/mathesar/issues/new/choose) or submit a PR proposing changes to [this file](https://github.com/mathesar-foundation/mathesar/blob/master/docs/docs/installation/build-from-source/index.md).

## Requirements

### System

We recommend having at least 60 GB disk space and 4 GB of RAM.

### Operating System

We've tested this on **Debian 12**, but we expect that it can be adapted for other Linux distributions as well.

### Access

You should have **root access** to the machine you're installing Mathesar on.

### Software

You'll need to install the following system packages before you install Mathesar:

- [Python](https://www.python.org/downloads/) 3.9, 3.10, or 3.11

    !!! note "Python version"

        Python _older_ than 3.9 will not run Mathesar.

        Python 3.12 will run Mathesar, but you'll have to take extra steps to get some dependencies to build. Installing a package for your OS that provides the `libpq-fe.h` header file should be enough in most cases. On Debian 12, this header is provided by the `libpq-dev` package.

- [PostgreSQL](https://www.postgresql.org/download/linux/) 13 or newer (Verify by logging in, and running the query: `SELECT version();`)

- [Caddy](https://caddyserver.com/docs/install) (Verify with `caddy version`)

- [git](https://git-scm.com/downloads) (Verify with `git --version`)

- [GNU gettext](https://www.gnu.org/software/gettext/) (Verify with `gettext --version`)

### Domain (optional)

If you want Mathesar to be accessible over the internet, you'll probably want to set up a domain or sub-domain to use. **If you don't need a domain, you can skip this section.**

Before you start installation, **ensure that the DNS for your sub-domain or domain is pointing to the machine that you're installing Mathesar on**.

## Customizing this Guide

Type your domain name into the box below. Do not include a trailing slash.

<input data-input-for="DOMAIN_NAME" aria-label="Your Domain name "/>

Then press <kbd>Enter</kbd> to customize this guide with your domain name.

## Installation Steps

### Set up the database

1. Open a `psql` shell.

    ```
    sudo -u postgres psql  # Modify based on your Postgres installation.
    ```

1. Let's create a Postgres user for Mathesar

    ```postgresql
    CREATE USER mathesar WITH ENCRYPTED PASSWORD '1234';
    ```

    !!! warning "Customize your password"
        Be sure to change the password `1234` in the command above to something more secure and private. Record your custom password somewhere safe. You will need to reference it later.

1. Next, we have to create a database for storing Mathesar metadata. Your PostgreSQL user will either need to be a `SUPERUSER` or `OWNER` of the database. In this guide, we will be setting the user to be `OWNER` of the database as it is slightly restrictive compared to a `SUPERUSER`.

    ```postgresql
    CREATE DATABASE mathesar_django OWNER mathesar;
    ```

1. Now we let us create a database for storing your data.

    ```postgresql
    CREATE DATABASE your_db_name OWNER mathesar;
    ```

1. Press <kbd>Ctrl</kbd>+<kbd>D</kbd> to exit the `psql` shell.


### Set up your installation directory

1. Choose a directory to store the Mathesar application files.

    !!! example "Examples"
        - `/home/my_user_name/mathesar`
        - `/etc/mathesar`

1. Type your installation directory into the box below. Do not include a trailing slash.

    <input data-input-for="MATHESAR_INSTALLATION_DIR" aria-label="Your Mathesar installation directory"/>

    Then press <kbd>Enter</kbd> to customize this guide with your installation directory.

1. Create your installation directory.

    ```
    mkdir -p xMATHESAR_INSTALLATION_DIRx
    ```

    !!! note "When installing outside your home folder"
        If you choose a directory outside your home folder, then you'll need to create it with `sudo` and choose an appropriate owner for the directory (i.e. `root` or a custom user of your choosing).
        
        The remainder of this guide requires you to **run commands with full permissions inside your installation directory**. You can do this, for example via:

        - `chown my_user_name: xMATHESAR_INSTALLATION_DIRx`

            Or

        - `sudo su`

1. Navigate into your installation directory.

    ```
    cd xMATHESAR_INSTALLATION_DIRx
    ```

    The remaining commands in this guide should be run from within your installation directory.


### Set up the environment

1. Clone the git repo into the installation directory.

    ```
    git clone https://github.com/centerofci/mathesar.git .
    ```

1. Checkout the tag of the latest stable release, `{{mathesar_version}}`.

    ```
    git checkout {{mathesar_version}}
    ```

    !!! warning "Important"
        If you don't run the above command you'll end up installing the latest _development_ version of Mathesar, which will be less stable.

    !!! tip
        You can install a specific Mathesar release by running commands like `git checkout 0.1.1` (to install version 0.1.1, for example). You can see all available versions by running `git tag`.

1. We need to create a python virtual environment for the Mathesar application.

    ```
    <path-to-python-binary> -m venv ./mathesar-venv
    # /usr/bin/python3.9 -m venv ./mathesar-venv
    ```

1. Next we will activate our virtual environment:

    ```
    source ./mathesar-venv/bin/activate
    ```

    !!! warning "Important"
        You need to activate the environment each time you restart the shell as they don't persist across sessions.


### Install the Mathesar application

1. Install Python dependencies

    ```
    pip install -r requirements-prod.txt
    ```

1. Set the environment variables

    1. Create `.env` file

        ```
        touch .env
        ```

    1. Edit your `.env` file, adding [environment variables](../../configuration/env-variables.md) to configure Mathesar.

        !!! example
            Your `.env` file should look something like this
            
            ```
            DOMAIN_NAME='xDOMAIN_NAMEx'
            ALLOWED_HOSTS='xDOMAIN_NAMEx'
            SECRET_KEY='REPLACE_THIS_WITH_YOUR_RANDOMLY_GENERATED_VALUE' # REPLACE THIS!
            POSTGRES_DB=mathesar_django
            POSTGRES_USER=mathesar
            POSTGRES_PASSWORD=mathesar1234  # Do not use this password!
            POSTGRES_HOST=localhost
            POSTGRES_PORT=5432
            ```

        !!! tip
            You can generate a [SECRET_KEY variable](../../configuration/env-variables.md#secret_key) by running:

            ```
            echo $(cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | head -c 50)
            ```

    1. Add the environment variables to the shell
   
        You need to `export` the environment variables listed in the `.env` file to your shell. The easiest way would be to run the below command.
    
          ```
          export $(cat .env)
          ```
       
        !!! warning "Important"
            You need to export the environment variables each time you restart the shell as they don't persist across sessions.


1. Download release static files and extract into the correct directory

    ```
    wget https://github.com/mathesar-foundation/mathesar/releases/download/{{mathesar_version}}/static_files.zip
    unzip static_files.zip && mv static_files /mathesar/static/mathesar
    ```


1. Compile Mathesar translation files

    ```
    python manage.py compilemessages
    ```


1. Install Mathesar functions on the database:

    ```
    python -m mathesar.install --skip-confirm | tee /tmp/install.py.log
    ```


1. Create a media directory for storing user-uploaded media

    ```
    mkdir .media
    ```

### Set up Gunicorn

!!! note "Elevated permissions needed"
    Most of the commands below need to be run as a root user, or using `sudo`. If you try to run one of these commands, and see an error about "permission denied", use one of those methods.

1. Create a user for running Gunicorn

    ```
    groupadd gunicorn && \
    useradd gunicorn -g gunicorn
    ```

1. Make the `gunicorn` user the owner of the `.media` directory

    ```
    chown -R gunicorn:gunicorn .media/
    ```

1. Create the Gunicorn SystemD service file.

    ```
    touch /lib/systemd/system/gunicorn.service
    ```

    and copy the following code into it.

    ```text
    [Unit]
    Description=gunicorn daemon
    After=network.target network-online.target
    Requires=network-online.target
    
    [Service]
    Type=notify
    User=gunicorn
    Group=gunicorn
    RuntimeDirectory=gunicorn
    WorkingDirectory=xMATHESAR_INSTALLATION_DIRx
    ExecStart=/bin/bash -c 'xMATHESAR_INSTALLATION_DIRx/mathesar-venv/bin/gunicorn config.wsgi:application'
    EnvironmentFile=xMATHESAR_INSTALLATION_DIRx/.env
    
    [Install]
    WantedBy=multi-user.target
    ```

1. Reload `systemctl` and start the Gunicorn socket

    ```
    systemctl daemon-reload
    systemctl start gunicorn.service
    systemctl enable gunicorn.service
    ```

1. Check the logs to verify if Gunicorn is running without any errors
    
    ```
    journalctl --priority=notice --unit=gunicorn.service
    ```

### Set up the Caddy reverse proxy

!!! info ""
    We will use the Caddy Reverse proxy to serve the static files and set up SSL certificates.

1. Create the CaddyFile

    ```
    touch /etc/caddy/Caddyfile
    ```

2. Add the configuration details to the CaddyFile

    ```
    https://xDOMAIN_NAMEx {
        log {
            output stdout
        }
        respond /caddy-health-check 200
        encode zstd gzip
        handle_path /media/* {
            @downloads {
                query dl=*
            }
            header @downloads Content-disposition "attachment; filename={query.dl}"
    
            file_server {
                precompressed br zstd gzip
                root {$MEDIA_ROOT:xMATHESAR_INSTALLATION_DIRx/.media/}
            }
        }
        handle_path /static/* {
            file_server {
                precompressed br zstd gzip
                root {$STATIC_ROOT:xMATHESAR_INSTALLATION_DIRx/static/}
            }
        }
        reverse_proxy localhost:8000
    }
    ```

1. Create a user for running Caddy

    ```
    groupadd caddy && \
    useradd caddy -g caddy
    ```

1. Create the Caddy systemd service file.

    ```
    touch /lib/systemd/system/caddy.service
    ```

    and copy the following code into it.

    ```
    [Unit]
    Description=Caddy
    Documentation=https://caddyserver.com/docs/
    After=network.target network-online.target
    Requires=network-online.target
    
    [Service]
    Type=notify
    User=caddy
    Group=caddy
    ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile
    ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force
    TimeoutStopSec=5s
    LimitNOFILE=1048576
    LimitNPROC=512
    PrivateTmp=true
    ProtectSystem=full
    AmbientCapabilities=CAP_NET_BIND_SERVICE
    
    [Install]
    WantedBy=multi-user.target
    ```


1. Reload the systemctl and start the Caddy socket

    ```
    systemctl daemon-reload && \
    systemctl start caddy.service && \
    systemctl enable caddy.service
    ```

1. Check the logs to verify if Caddy is running without any errors
    
    ```
    journalctl --priority=notice --unit=caddy.service
    ```

### Set up your user account
Mathesar is now installed! You can use it by visiting the URL `xDOMAIN_NAMEx`.

You'll be prompted to set up an admin user account the first time you open Mathesar. Follow the instructions on screen.
