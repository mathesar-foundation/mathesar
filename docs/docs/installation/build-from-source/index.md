# Install Mathesar from source on Linux


!!! warning ""
    To follow this guide you need to have a good knowledge of Linux server administration, and be familiar with using the command line interface and some common utilities.




## Requirements

- We've tested this on **Ubuntu**, but we expect it work on other Linux distros too.
- You'll need **root** privileges.
- You'll need to install the following system packages before installing Mathesar:

    - [Python](https://www.python.org/downloads/) 3.9

        !!! note "Python version"
            Python _older_ than 3.9 will not run Mathesar.

            Python _newer_ than 3.9 will run Mathesar, but will require some slightly modified installation steps which we have [not yet documented](https://github.com/centerofci/mathesar/issues/2872).

    - [PostgreSQL](https://www.postgresql.org/download/linux/) 13 or newer (Verify with `psql --version`)

    - [NodeJS](https://nodejs.org/en/download) 14 or newer (Verify with `node --version`)

        _(This is required for installation only and will eventually be [relaxed](https://github.com/centerofci/mathesar/issues/2871))_

    - [Caddy](https://caddyserver.com/docs/install) (Verify with `caddy version`)

    - [git](https://git-scm.com/downloads) (Verify with `git --version`)

- We recommend having at least 60 GB disk space and 4 GB of RAM.
- You'll need a domain name or subdomain for your installation.
    Type your domain name into the box below. Do not include a trailing slash.

    <input data-input-for="DOMAIN_NAME" aria-label="Your Domain name "/>

    Then press <kbd>Enter</kbd> to customize this guide with your domain name.



## Install

### Set up the database

1. Open a `psql` shell.

    ```sh
    sudo -u postgres psql
    ```

1. Mathesar needs a Postgres superuser to function correctly. Let's create a superuser.

    ```postgresql
    CREATE USER mathesar WITH SUPERUSER ENCRYPTED PASSWORD '1234';
    ```

    !!! warning "Customize your password"
        Be sure to change the password `1234` in the command above to something more secure and private. Record your custom password somewhere safe. You will need to reference it later.

1. Next, we have to create a database for storing Mathesar metadata.

    ```postgresql
    CREATE DATABASE mathesar_django;
    ```

1. Now we let us create a database for storing your data.

    ```postgresql
    CREATE DATABASE your_db_name;
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

    ```sh
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

    ```sh
    <path-to-python-binary> -m venv ./mathesar-venv
    # /usr/bin/python3.9 -m venv ./mathesar-venv
    ```

1. Next we will activate our virtual environment:

    ```sh
    source ./mathesar-venv/bin/activate
    ```

### Install the Mathesar application

1. Install Python dependencies

    ```sh
    pip install -r requirements.txt
    ```

1. Set the environment variables

    1. Create .env file

        ```sh
        touch .env
        ```

    1. Edit your `.env` file, making the following changes:

        - Add the [**Backend Configuration** environment variables](../../configuration/env-variables.md#backend)
        - Customize the values of the environment variables to suit your needs.

        !!! example
            Your `.env` file should look something like this
            
            ``` bash
            ALLOWED_HOSTS='xDOMAIN_NAMEx'
            SECRET_KEY='dee551f449ce300ee457d339dcee9682eb1d6f96b8f28feda5283aaa1a21'
            DJANGO_DATABASE_URL=postgresql://mathesar:1234@localhost:5432/mathesar_django
            MATHESAR_DATABASES=(your_db_name|postgresql://mathesar:1234@localhost:5432/your_db_name)
            ```

    1. Add the environment variables to the shell
   
        You need to `export` the environment variables listed in the `.env` file to your shell. The easiest way would be to run the below command.
    
          ```sh
          export $(sudo cat .env)
          ```
       
        !!! info ""
            You need to export the environment variables each time you restart the shell as they don't persist across sessions.


1. Install the frontend dependencies

    ```sh
    npm install --prefix mathesar_ui
    ```
      
1. Compile the Mathesar Frontend App
   ```sh
   npm run --prefix mathesar_ui build --max_old_space_size=4096
   ```

1. Install Mathesar functions on the database:

    ```sh
    python install.py --skip-confirm | tee /tmp/install.py.log
    ```

1. Create a Mathesar admin/superuser:

    ```sh
    python manage.py createsuperuser
    ```

    A prompt will appear to ask for the superuser details. Fill in the details to create a superuser. At least one superuser is necessary for accessing Mathesar.
    
    See the Django docs for more information on the [`createsuperuser` command](https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser)

1. Create a media directory for storing user-uploaded media

    ```sh
    mkdir .media
    ```

### Set up Gunicorn

!!! info ""
    We will use `systemd` to run the `gunicorn` service as it lets you use easily start and manage the service.

1. Create a user for running Gunicorn

    ```sh
    sudo groupadd gunicorn && \
    sudo useradd gunicorn -g gunicorn
    ```

1. Create the Gunicorn systemd service file.

    ```sh
    sudo touch /lib/systemd/system/gunicorn.service
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

1. Reload the systemctl and Start the Gunicorn socket

    ```sh
    sudo systemctl daemon-reload && \
    sudo systemctl start gunicorn.service && \
    sudo systemctl enable gunicorn.service
    ```

### Set up the Caddy reverse proxy

!!! info ""
    We will be using the Caddy Reverse proxy to serve the static files and set up SSL certificates.

1. Create the CaddyFile

    ```sh
    sudo touch /etc/caddy/Caddyfile
    ```

2. Add the configuration details to the CaddyFile

    ```text
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

    ```sh
    sudo groupadd caddy && \
    sudo useradd caddy -g caddy
    ```

1. Create the Caddy systemd service file.

    ```sh
    sudo touch /lib/systemd/system/caddy.service
    ```

    and copy the following code into it.

    ```text
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


1. Reload the systemctl and Start the Caddy socket

    ```sh
    sudo systemctl daemon-reload && \
    sudo systemctl start caddy.service && \
    sudo systemctl enable caddy.service
    ```

Now you can start using the Mathesar app by visiting the URL `xDOMAIN_NAMEx`


## Administration

### Upgrade

1. Go to your Mathesar installation directory.

    ```sh
    cd xMATHESAR_INSTALLATION_DIRx
    ```

    !!! note
        Your installation directory may be different from above if you used a different directory when installing Mathesar.

1. Pull the latest version from the repository

    ```sh
    git pull https://github.com/centerofci/mathesar.git
    ```

1. Update Python dependencies

    ```sh
    pip install -r requirements.txt
    ```

1. Next we will activate our virtual environment:

    ```sh
    source ./mathesar-venv/bin/activate
    ```

1. Add the environment variables to the shell before running Django commands

    ```sh
    export $(sudo cat .env)
    ```

1. Run the latest Django migrations

    ```sh
    python manage.py migrate
    ```

1. Install the frontend dependencies

    ```sh
    npm install --prefix mathesar_ui
    ```
      
1. Build the Mathesar frontend app

    ```sh
    npm run --prefix mathesar_ui build --max_old_space_size=4096
    ```

1. Update Mathesar functions on the database:

    ```sh
    python install.py --skip-confirm >> /tmp/install.py.log
    ```

1. Restart the gunicorn server

    ```sh
    sudo systemctl restart gunicorn
    ```


### Uninstall

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


1. Remove Mathesar internal schemas.

    **If you connected Mathesar to a database**, the installation process would have created a new schema for Mathesar's use. You can remove this schema from that database as follows:

    1. Connect to the database.

        ```
        psql -h <DB HOSTNAME> -p <DB PORT> -U <DB_USER> <DB_NAME>
        ```

    2. Delete the types schema.

        ```postgresql
        DROP SCHEMA mathesar_types CASCADE;
        ```

        !!! danger ""
            Deleting this schema will also delete any database objects that depend on it. This should not be an issue if you don't have any data using Mathesar's custom data types.

    3. Delete the function schemas.

        ```postgresql
        DROP SCHEMA msar CASCADE;
        DROP SCHEMA __msar CASCADE;
        ```
