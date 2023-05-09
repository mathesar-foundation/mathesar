# Build Mathesar from source on Linux OS

Installation should only take a few minutes.

## Prerequisites

- Any Linux distro with at least `60 GB` disk space and `4GB` of RAM.
  - We've tested it on Ubuntu. But it should work on other distros too.
- Root privileges
- [Python v3.9](https://www.python.org/downloads/)
- [NodeJS v14.x](https://nodejs.org/en/download)
- [Postgres v13](https://www.postgresql.org/download/linux/)
- [Gunicorn3](https://docs.gunicorn.org/en/stable/install.html)
- [Caddy](https://caddyserver.com/docs/install)

- Domain name, or subdomain, for your installation. We will use `mathesar.example.com` as the domain for our website.


## Set up the Database

1. Open up Psql
```sh
sudo -u postgres psql
```

1. Mathesar needs a superuser to function correctly. Let's create a superuser.
```postgresql
-- Run the command in the psql prompt
CREATE USER mathesar WITH SUPERUSER ENCRYPTED PASSWORD 'mathesar';
```

1. Next, we have to create a database for storing Mathesar metadata.
```postgresql
-- Run the command in the psql prompt
CREATE DATABASE mathesar_django;
```

1. Now we let us create a database for storing your data.
```postgresql
-- Run the command in the psql prompt
CREATE DATABASE your_db_name;
```

### Set up the Environment
1. We need to create a python virtual environment for the Mathesar application.
```sh
python3.9 -m venv /<virtual-env-directory>/mathesar
```

1. Next we will activate our virtual environment:
```sh
. /<virtual-env-directory>/mathesar/bin/activate
```

1. Clone the Mathesar repo
```sh
cd /<working-directory>/
git clone https://github.com/centerofci/mathesar.git
```

### Install the Mathesar application

1. Install Python dependencies
```sh
cd mathesar/
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
          export $(sudo cat /<working-directory>/mathesar/.env)
          ```
       
        !!! info ""
            You need to export the environment variables each time you restart the shell as they don't persist across sessions.

1. Run Django migrations
    ```sh
    python /<working-directory>/mathesar/manage.py migrate
    ```
1. Install the frontend dependencies
  ```sh
  cd /<working-directory>/mathesar/mathesar_ui && npm install
  ```
      
1. Compile the Mathesar Frontend App
   ```sh
   npm run build --max_old_space_size=4096
   ```

1. Install Mathesar functions on the database:
```sh
cd /<working-directory>/mathesar && python3 install.py --skip-confirm >> /tmp/install.py.log
```

1. Create a Mathesar admin/superuser:
    ```sh
    python manage.py createsuperuser
    ```

    A prompt will appear to ask for the superuser details. Fill in the details to create a superuser. At least one superuser is necessary for accessing Mathesar.
    
    See the Django docs for more information on the [`createsuperuser` command](https://docs.djangoproject.com/en/4.2/ref/django-admin/#createsuperuser)

1. Create a media directory for storing user-uploaded media
    ```sh
    mkdir /<working-directory>/.media
    ```

### Set up Gunicorn
!!! info ""
    We will use `systemd` to run the `gunicorn` service as it lets you use easily start and manage the service.

1. Create a user for running Gunicorn
```sh
sudo groupadd gunicorn
useradd gunicorn -g gunicorn
```

1. Create the Gunicorn systemd service file.
    ```sh
    touch /lib/systemd/system/gunicorn.service
    ```
and copy the following code into it.

    ```sh
    [Unit]
    Description=gunicorn daemon
    Requires=gunicorn.socket
    After=network.target
    
    [Service]
    Type=notify
    User=gunicorn
    Group=gunicorn
    RuntimeDirectory=gunicorn
    WorkingDirectory=/<working-directory>/mathesar
    ExecStart=/bin/bash -c '/<virtual-env-directory>/mathesar/bin/gunicorn config.wsgi:application'
    EnvironmentFile=/<working-directory>/mathesar/.env
    
    [Install]
    WantedBy=multi-user.target
    ```

1. Create a Gunicorn socket

    ```sh
    touch /lib/systemd/system/gunicorn.socket
    ```
and copy the following code into `gunicorn.socket` file

    ```sh
    [Unit]
    Description=gunicorn socket
    
    [Socket]
    ListenStream=/run/gunicorn.sock
    # Our service won't need permissions for the socket, since it
    # inherits the file descriptor by socket activation
    # only the nginx daemon will need access to the socket
    SocketUser=www-data
    
    [Install]
    WantedBy=sockets.target
    ```

1. Reload the systemctl and Start the Gunicorn socket
```sh
systemctl daemon-reload && systemctl start gunicorn.socket
```

### Set up the Caddy Reverse Proxy

!!! info ""
    We will be using the Caddy Reverse proxy to serve the static files and set up SSL certificates

1. Create the CaddyFile
    ```sh
    touch /etc/caddy/Caddyfile
    ```

2. Add the configuration details to the CaddyFile
    ```sh
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
                root {$MEDIA_ROOT:/<working-directory>/mathesar/media/}
            }
        }
        handle_path /static/* {
            file_server {
                precompressed br zstd gzip
                root {$STATIC_ROOT:/<working-directory>/mathesar/static/}
            }
        }
        reverse_proxy localhost:8000
    }
    ```

1. Start the caddy service

    ```
    caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
    ```

Now you can start using the Mathesar app by visiting the URL `https://mathesar.example.com`