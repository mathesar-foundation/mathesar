# Build Mathesar from source on Linux OS

## Prerequisites

- Any Linux distro with at least `60 GB` disk space and `4GB` of RAM.
    - We've tested it on Ubuntu. But it should work on other Linux distros too.
- Root privileges
- [Python v3.9](https://www.python.org/downloads/)
- [NodeJS v14.x](https://nodejs.org/en/download)
- [Postgres v13](https://www.postgresql.org/download/linux/)
- [Caddy](https://caddyserver.com/docs/install)

- Domain name, or subdomain, for your installation. We will use `mathesar.example.com` as the domain for our website.


## Set up the Database

1. Open a `psql` shell.

    ```sh
    sudo -u postgres psql
    ```

1. Mathesar needs a superuser to function correctly. Let's create a superuser.

    ```postgresql
    CREATE USER mathesar WITH SUPERUSER ENCRYPTED PASSWORD 'mathesar';
    ```

1. Next, we have to create a database for storing Mathesar metadata.

    ```postgresql
    CREATE DATABASE mathesar_django;
    ```

1. Now we let us create a database for storing your data.

    ```postgresql
    CREATE DATABASE your_db_name;
    ```

1. Press <kbd>Ctrl</kbd>+<kbd>D</kbd> to exit the `psql` shell.


!!! note "Default Directory"
    We will be using the home directory(accessed by `~/`) as the default working directory. 

### Set up the Environment

1. Clone the Mathesar repo.

    ```sh
    cd ~/
    git clone https://github.com/centerofci/mathesar.git
    ```


1. We need to create a python virtual environment for the Mathesar application.

    ```sh
    python3.9 -m venv ~/mathesar/mathesar-venv
    ```

1. Next we will activate our virtual environment:

    ```sh
    . ~/mathesar/mathesar-venv/bin/activate
    ```

### Install the Mathesar application

1. Install Python dependencies

    ```sh
    cd ~/mathesar/
    pip3 install -r requirements.txt
    ```

1. Set the environment variables

    1. Create .env file

        ```sh
        touch .env
        ```

    1. Edit your `.env` file, making the following changes:

        - Add the [**Backend Configuration** environment variables](./configuration.md#backend)
        - Add the [**Database Configuration** environment variables](./configuration.md#database)
        - Customize the values of the environment variables to suit your needs.

        !!! example
            Your `.env` file should look something like this
            
            ``` bash
            ALLOWED_HOSTS='https://mathesar.example.com'
            SECRET_KEY='dee551f449ce300ee457d339dcee9682eb1d6f96b8f28feda5283aaa1a21'
            DJANGO_DATABASE_URL='postgresql://mathesar:mathesar@localhost:5432/mathesar_django'
            MATHESAR_DATABASES='(your_db_name|postgresql://mathesar:mathesar@localhost:5432/your_db_name)'
            ```

    1. Add the environment variables to the shell
   
        You need to `export` the environment variables listed in the `.env` file to your shell. The easiest way would be to run the below command.
    
          ```sh
          export $(sudo cat ~/mathesar/.env)
          ```
       
        !!! info ""
            You need to export the environment variables each time you restart the shell as they don't persist across sessions.

1. Run Django migrations

    ```sh
    python ~/mathesar/manage.py migrate
    ```

1. Install the frontend dependencies

    ```sh
    cd ~/mathesar/mathesar_ui && npm install
    ```
      
1. Compile the Mathesar Frontend App
   ```sh
   npm run build --max_old_space_size=4096
   ```

1. Install Mathesar functions on the database:

    ```sh
    cd ~/mathesar && python3 install.py --skip-confirm >> /tmp/install.py.log
    ```

1. Create a Mathesar admin/superuser:

    ```sh
    python manage.py createsuperuser
    ```

    A prompt will appear to ask for the superuser details. Fill in the details to create a superuser. At least one superuser is necessary for accessing Mathesar.
    
    See the Django docs for more information on the [`createsuperuser` command](https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser)

1. Create a media directory for storing user-uploaded media

    ```sh
    mkdir ~/mathesar/.media
    ```

### Set up Gunicorn

!!! info ""
    We will use `systemd` to run the `gunicorn` service as it lets you use easily start and manage the service.

1. Create a user for running Gunicorn

    ```sh
    sudo groupadd gunicorn && \
    useradd gunicorn -g gunicorn
    ```

1. Create the Gunicorn systemd service file.

    ```sh
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
    WorkingDirectory=~/mathesar
    ExecStart=/bin/bash -c '~/mathesar/mathesar-venv/bin/gunicorn config.wsgi:application'
    EnvironmentFile=~/mathesar/.env
    
    [Install]
    WantedBy=multi-user.target
    ```

1. Reload the systemctl and Start the Gunicorn socket

    ```sh
    systemctl daemon-reload && \
    systemctl start gunicorn.service && \
    systemctl enable gunicorn.service
    ```

### Set up the Caddy Reverse Proxy

!!! info ""
    We will be using the Caddy Reverse proxy to serve the static files and set up SSL certificates.

1. Create the CaddyFile

    ```sh
    touch /etc/caddy/Caddyfile
    ```

2. Add the configuration details to the CaddyFile

    ```text
    mathesar.example.com {
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
                root {$MEDIA_ROOT:~/mathesar/media/}
            }
        }
        handle_path /static/* {
            file_server {
                precompressed br zstd gzip
                root {$STATIC_ROOT:~/mathesar/static/}
            }
        }
        reverse_proxy localhost:8000
    }
    ```

1. Create a user for running Caddy

    ```sh
    sudo groupadd caddy && \
    useradd caddy -g caddy
    ```

1. Create the Caddy systemd service file.

    ```sh
    touch /lib/systemd/system/caddy.service
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
    systemctl daemon-reload && \
    systemctl start caddy.service && \
    systemctl enable caddy.service
    ```

Now you can start using the Mathesar app by visiting the URL `https://mathesar.example.com`


## Administration

### Upgrade

1. Go to the working directory

    ```sh
    cd mathesar/
    ```

1. Pull the latest version from the repository

    ```sh
    git pull https://github.com/centerofci/mathesar.git
    ```

1. Update Python dependencies

    ```sh
    pip3 install -r requirements.txt
    ```

1. Add the environment variables to the shell before running Django commands

    ```sh
    export $(sudo cat ~/mathesar/.env)
    ```

1. Run the latest Django migrations

    ```sh
    python ~/mathesar/manage.py migrate
    ```

1. Update the frontend dependencies

    ```sh
    cd ~/mathesar/mathesar_ui && npm install
    ```
      
1. Compile the Mathesar Frontend App
   ```sh
   npm run build --max_old_space_size=4096
   ```

1. Update Mathesar functions on the database:

    ```sh
    cd ~/mathesar && \
      python3 install.py --skip-confirm >> /tmp/install.py.log
    ```

1. Restart the gunicorn server

    ```sh
    systemctl restart gunicorn
    ```


### Uninstall

1. Stop Caddy service
    ```sh
    systemctl disable caddy.service && systemctl stop caddy.service
    ```

1. Remove Caddy service file and Caddyfile
    ```sh
    rm /lib/systemd/system/caddy.service && rm /etc/caddy/Caddyfile
    ```

1. Stop Gunicorn
    ```sh
    systemctl disable gunicorn.service && systemctl stop gunicorn.service
    ```

1. Remove Gunicorn service file
    ```sh
    rm /lib/systemd/system/gunicorn.service
    ```

1. Remove Mathesar directory
    ```sh
    rm -r ~/mathesar/
    ```

1. Remove Django database
    1. Connect to the Psql terminal.

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

    2. Delete the schema.

        ```postgresql
        DROP SCHEMA mathesar_types CASCADE;
        ```

        !!! danger 
            Deleting this schema will also delete any database objects that depend on it. This should not be an issue if you don't have any data using Mathesar's custom data types.

