# Build Mathesar from source on Ubuntu 22

Installation should only take a few minutes.

## Prerequisites

- Ubuntu 22 with at least `60 GB` disk space and `4GB` of RAM.
- Root privileges
- Python v3.9
- NodeJS v14.x
- Postgres v13
- Gurnicorn3
- Nginx
- Domain name, or subdomain, for your installation. We will use `mathesar.example.com` as the domain for our website.

!!! tip ""

       Pay close attention to all commands / blocks of code as your FQDN/URL will be used in quite a few places.  It is important you change it everywhere.

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

        - Add the [**Backend Configuration** environment variables](../configuration.md#backend)
        - Add the [**Database Configuration** environment variables](../configuration.md#database)
        - Customize the values of the environment variables to suit your needs.

        !!! example
            Your `.env` file should look something like this
            
            ``` bash
            ALLOWED_HOSTS='https://<your_domain_name>'
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

Now we will run install:

```sh
cd /<working-directory>/mathesar && python3 install.py --skip-confirm >> /tmp/install.py.log
```

The last step, is to create our admin/superuser login:

```sh
python manage.py createsuperuser
```


#### Collect the static files

```sh
python /<working-directory>/mathesear/manage.py collectstatic
```

Create media directory and set permissions to be writable by gunicorn

```sh
mkdir /<working-directory>/.media
chgrp gunicorn /<working-directory>/.media
chown -R gunicorn /<working-directory>/.media
chmod 0744 /<working-directory>/.media
```

#### Set up Gunicorn

Next, we will create the gunicorn user and group on the system.

```sh
sudo groupadd gunicorn
useradd gunicorn -g gunicorn
```

Next, we will create the configuration file for Gunicorn on our site.

```sh
touch <directory>/gunicorn_conf.py
```

Next lets copy the following code into it. Pay attention as you have to edit the code according to your FQDN / URL.

```sh
errorlog = '/var/log/gunicorn/mathesar.example.com-error.log'
loglevel = 'info'
accesslog = '/var/log/gunicorn/mathesar.example.com-access.log'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
```

Next, we will create the logging directory for Gunicorn and assign it to the gunicorn user & group.

```sh
sudo mkdir /var/log/gunicorn # Only if it does not exist already, but installation of Gunicorn should have created this and assigned to www-data user/group
chmod 0755 /var/log/gunicorn
chgrp gunicorn /var/log/gunicorn
chown gunicorn /var/log/gunicorn
```

Next, we will create the Gunicorn systemd service. You must create the file here: `/lib/systemd/system/gunicorn.service`
and copy the following code into it. Pay attention as you have to edit the code according to your FQDN / URL.

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
ExecStart=/bin/bash -c '/opt/virtualenvs/mathesar/bin/gunicorn -c /<working-directory>/gunicorn_conf.py config.wsgi:application'
EnvironmentFile=/etc/gunicorn-env

ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

The permissions for the file must be 0644 so run this when you are
done: `chmod 0644 /lib/systemd/system/gunicorn.service`

Next we will create the Gunicorn systemd socker. You must create the file here: `/lib/systemd/system/gunicorn.socket`
and copy the following code into it.

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

The permissions for the file must be 0644 so run this when you are
done: `chmod 0644 /lib/systemd/system/gunicorn.socket`

Next we will create the Gunicorn environment file for the service. You must create the file here: `/etc/gunicorn-env`
and copy the following code into it.

```sh
{% for k,v in django_settings.items() %}
{{ k }}={{ v }}
{% endfor %}
```

The permissions for the file must be 0400 so run this when you are done: `chmod 0400 /etc/gunicorn-env`

We will now reload systemctl:

```sh
systemctl daemon-reload
```

```sh
sudo apt install nginx
```

We have to remove default nginx config, so that we can install a nginx site for letsencrypt requests

```sh
rm -f /etc/nginx/sites-enabled/default
```

Next we will create a new site. Begin by creating the http file in '/etc/nginx/sites-enabled'.

```sh
touch /etc/nginx/sites-enabled/http
```

Now, we can add our custom directives to the file. You can edit the file and add the following code to it.

```sh
server_tokens off;

server {
    listen 80 default_server;
    server_name mathesar.example.com;

    location /.well-known/acme-challenge {
        root /var/www/letsencrypt;
        try_files $uri $uri/ =404;
    }

    location / {
        rewrite ^ https://mathesar.example.com$request_uri? permanent;
    }
}
```

Now we will install our system Nginx configuration.  
You can copy/paste this in your terminal and run it.

```sh
echo "user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 768;
}

http {

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_comp_level    6;
    gzip_disable "msie6";

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}" > /etc/nginx/nginx.conf
```

##### Letsencrypt

We now will install certbot for Letsencrypt as well as gunicorn3.

```sh
sudo apt-get install certbot
```

Now we need to create a directory for Letsencrypt

```sh
mkdir /var/www/letsencrypt
```

We will also need a directory for our website itself. In this case, we will use `mathesar.example.com` as noted earlier.
We will also assign it to the `www-data` user and group. Then we will change the permissions of the folder to get it
ready for a website.

```sh
mkdir /var/www/mathesar.example.com
chgrp www-data /<working-directory>/
chown -R www-data:www-data /var/www/mathesar.example.com
chmod 0755 /<working-directory>/
```

This file can be placed in /<working-directory>/mathesar

Next, we will install the Nginx site for mathesar.example.com.

```sh
echo "# Gunicorn socket
upstream app_server {
  # fail_timeout=0 means we always retry an upstream even if it failed
  # to return a good HTTP response

  server unix:/run/gunicorn.sock fail_timeout=0;
}

# HTTPS server
server {
  listen 443 ssl default deferred;
  server_name mathesar.example.com;

  ssl_certificate         /etc/letsencrypt/live/mathesar.example.com/fullchain.pem;
  ssl_certificate_key     /etc/letsencrypt/live/mathesar.example.com/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/mathesar.example.com/fullchain.pem;

  ssl_session_cache shared:SSL:50m;
  ssl_session_timeout 5m;
  ssl_stapling on;
  ssl_stapling_verify on;

  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256;

  ssl_dhparam /etc/nginx/dhparams.pem;
  ssl_prefer_server_ciphers on;

  access_log /var/log/nginx/mathesar.example.com.access.log;
  error_log /var/log/nginx/mathesar.example.com.error.log;

  location / {
    # checks for static file, if not found proxy to app
    try_files $uri @proxy_to_app;
  }

  location /static/ {
    alias /<working-directory>/mathesar/static/;
  }

  location @proxy_to_app {
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $http_host;

    # note for the future:
    #   turn buffering off if using websockets or long polling
    #   also need to make sure gunicorn workers are running in async
    #   class
    # proxy_buffering off;

    # we don't want nginx trying to do something clever with
    # redirects, we set the Host: header above already.
    proxy_redirect off;
    proxy_pass http://app_server;
  }
}" > /etc/nginx/sites-enabled/mathesar.example.com
```

With this in place, we can now install the SSL certificate for our domain. You can run this command:

```sh
letsencrypt certonly -n --webroot -w /var/www/letsencrypt -m you@mathesar.example.com --agree-tos -d mathesar.example.com
```

Now that the SSL certificate is installed, lets create a cron job so that it gets renewed once a week. From the command
you will see `0 0 * * FRI` and this means it will renew at 00:00 every Friday.

```sh
echo "0 0 * * FRI     root    letsencrypt certonly -n --webroot -w /var/www/letsencrypt -m you@mathesar.example.com --agree-tos -d mathesar.example.com" >> /etc/crontab
```

Wait three minutes, and then check whether your cron file edit is valid by running the following command:

```sh
grep cron /var/log/syslog | tail -10
```

If you see ` (*system*) RELOAD (/etc/crontab)` in the log output without any error message attached, you did this
correctly.

Lastly, we will also generate the dhparams for Nginx:

```sh
openssl dhparam -dsaparam -out /etc/nginx/dhparams.pem 2048
```

