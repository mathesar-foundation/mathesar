# Manual install on Ubuntu 22

Installation should only take a few minutes.

## What we will do:
- Prepare the server

- ###### Database
  - Install PostgreSQL
  - Create Database, Database user
  - Create .env file for Django
- ###### Web Server
  - Install Nginx webserver 
  - Install Letsencrypt and Gurnicorn3  
- ##### Install Mathesar
  - Set up NodeJS
  - Set up Gunicorn 
- You need to be a user with root access to the machine you're trying to install Mathesar on. 
## Preparing our server.
- Prerequisites
    - Ubuntu 22 with at least `60 GB` disk space and `4GB` of RAM.
    - Root privileges
    - Domain name, or subdomain, for your installation.  We will use `mathesar.example.com` as the domain for our website
    - Python 3.9  
    
### Step one: Prepare the server
First, we need to update the software repository and upgrade all packages using the apt command below.  SSH to your server and elevate to the `root` user.
```sh
apt update && apt upgrade
```
Once the system has been updated, I recommend you perform a reboot to get the new kernel running incase it was updated.
Next we will install the required packages.
```sh
apt install locales build-essential acl ntp git python3-pip ipython3 zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev -y
```
Now we need to add a new usergroup and allow passwordless login:
```sh
sudo groupadd deployers \
useradd deployer \
usermod -a -G deployers deployer
```
Now you need to edit the `/etc/sudoers` file with the 'visudo' command, and add this line:  `deployer ALL=(ALL) NOPASSWD: ALL` under the `# User privilege specification` section.  If it fails to save, then edit again and move that to the last line of the file.  Remember to use TAB between the username and the first `ALL` section
You can test it with the following command:
```sh 
visudo -c
```
The output should look like this: `/etc/sudoers: parsed OK`. 

##### Install Python 3.9

We already installed the required dependencies in the previous step, so in the next step, we will download the Official Python 3.9 setup file using the “wget” command:

```sh
 wget https://www.python.org/ftp/python/3.9.7/Python-3.9.7.tgz
 ```
 Now we will unpack it, then change to the folder and run the configure script:
 ```sh
 tar -xvf Python-3.9.7.tgz
 cd Python-3.9.7/
 ./configure --enable-optimizations
 ```
 Next, utilize the “make” command to compile and build the configurations:
 ```sh
 make
 ```
 Finally, use the below-provided command to install Python 3 binaries on the Ubuntu 22.04 system:
 ```sh
 sudo make altinstall
 ```
 Confirm the Python successful installation by checking its version:
```sh
python3.9 --version
```
##### Switch python version
Now that we have multiple Python versions installed, we need to add the symbolic links for every Python version separately.  This will allow us to switch versions as needed on our system.  Run the following commands:
```sh
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1
sudo update-alternatives --install /usr/bin/python python /usr/local/bin/python3.9 2
```
This will create the necessary links.  You can now select which version of Python you want to use with the following command.  (You will select 2 here as we want Python 3.9)
```sh
sudo update-alternatives --config python
```


### Step Two: Install PostGreSQL
SSH to your server and run the following commands to update all the packages installed.
```sh
apt update && apt update
```
Now we will install the dependencies for PostGreSQL.  Note some of these may already be installed from a previous step.
```sh
apt install curl gpg gnupg2 software-properties-common apt-transport-https lsb-release ca-certificates
```
Now that we have updated and rebooted our system, let’s add the APT repository required to pull the packages form the PostgreSQL repository.
```sh
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc|sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
```
After importing GPG key, add repository contents to your Ubuntu 22.04|20.04|18.04 system:
```sh
echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" |sudo tee  /etc/apt/sources.list.d/pgdg.list
```
The repository added contains many different packages including third party addons. They include:

   - postgresql-client
   - postgresql
   - libpq-dev
   - postgresql-server-dev
   - pgadmin packages
With the repository added we can install the PostgreSQL 13 packages on our Ubuntu 22.04|20.04|18.04 Linux server. But first update the package index for the version to be available at the OS level.
```sh
apt update
```
Now we can install PostGreSQL 13 on the system.
```sh
apt install postgresql-13 postgresql-client-13
```
#### Mathesar: Create Database, Database user
Before we start, we first need to secure our database as the root user's password is not set.
```sh
sudo su - postgres
psql -c "alter user postgres with password 'StrongAdminP@ssw0rd'"
```
Now we can create our database, and user.  Replace `yourdbname`, `youruser` and `yourpass` with your own, secure variables.  Remember the `;` after each command.
```sh
sudo -u postgres psql #if you are not already in psql prompt
CREATE DATABASE yourdbname;
CREATE USER youruser WITH ENCRYPTED PASSWORD 'yourpass';
GRANT ALL PRIVILEGES ON DATABASE yourdbname TO youruser;
```
### Django: Create Database

Next we have to create a database for our Django app.  This database will use the same database user & password as the Mathesar database.  So once we create the database, we can simply add the same user to it.
```sh
sudo -u postgres psql #if you are not already in psql prompt
CREATE DATABASE djangodb;
GRANT ALL PRIVILEGES ON DATABASE djangodb TO youruser;
```
#### Create .env file for Django

From the previous step, you will need your to fill in the following variables for Django:
`
You can generate the secret key here: https://djecrety.ir/cat /v

```sh
ALLOWED_HOSTS: "*"
SECRET_KEY=
DJANGO_DATABASE_KEY=default
DJANGO_DATABASE_URL=postgres://{{ DATABASE_USER }}:{{ DATABASE_PASSWORD }}@127.0.0.1:5432/{{ DJANGO_DATABASE_NAME }}"
MATHESAR_DATABASES=(mathesar_tables|postgresql://{{ DATABASE_USER }}:{{ DATABASE_PASSWORD }}@127.0.0.1:5432/{{ MATHESAR_DATABASE_NAME }})
```
This file can be placed in /var/www/mathesar.examplecom/mathesar

### Step Three: Install Nginx with Letsencrypt and Gurnicorn3
We will start off by installing Nginx on the system.  This will already be in the Debian repository so simply run the install command.

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
Now, we can add our custom directives to the file.  You can edit the file and add the following code to it.
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
Now we will install Gunicorn using Python PIP.
```sh
pip3 install gunicorn
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
We will also need a directory for our website itself.  In this case, we will use `mathesar.example.com` as noted earlier. We will also assign it to the `www-data` user and group.  Then we will change the permissions of the folder to get it ready for a website.
```sh
mkdir /var/www/mathesar.example.com
chgrp www-data /var/www/mathesar.example.com/
chown -R www-data:www-data /var/www/mathesar.example.com
chmod 0755 /var/www/mathesar.example.com/
```
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
  ssl_ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4";

  ssl_dhparam /etc/nginx/dhparams.pem;
  ssl_prefer_server_ciphers on;

  access_log /var/log/nginx/mathesar.example.com.access.log;
  error_log /var/log/nginx/mathesar.example.com.error.log;

  location / {
    # checks for static file, if not found proxy to app
    try_files $uri @proxy_to_app;
  }

  location /static/ {
    alias mathesar.example.com/mathesar/static/;
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
With this in place, we can now install the SSL certificate for our domain.  You can run this command:
```sh
letsencrypt certonly -n --webroot -w /var/www/letsencrypt -m you@mathesar.example.com --agree-tos -d mathesar.example.com
```
Now that the SSL certificate is installed, lets create a cron job so that it gets renewed once a week.  From the command you will see `0 0 * * FRI` and this means it will renew at 00:00 every Friday.
```sh
echo "0 0 * * FRI     root    letsencrypt certonly -n --webroot -w /var/www/letsencrypt -m you@mathesar.example.com --agree-tos -d mathesar.example.com" >> /etc/crontab
```
Wait three minutes, and then check whether your cron file edit is valid by running the following command:
```sh
grep cron /var/log/syslog | tail -10
```
If you see ` (*system*) RELOAD (/etc/crontab)` in the log output without any error message attached, you did this correctly.

Lastly, we will also generate the dhparams for Nginx:
```sh
openssl dhparam -dsaparam -out /etc/nginx/dhparams.pem 2048
```
We are not finished with the Nginx & Letsencrypt section.

### Step Four: Install the Mathesar application
#### Set up NodeJS

##### Add the NodeJS key.
Firstly, we will add the NodeJS apt key, as well as the APT repo.  
```sh
KEYRING=/usr/share/keyrings/nodesource.gpg
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | sudo tee "$KEYRING" >/dev/null
gpg --no-default-keyring --keyring "$KEYRING" --list-keys
```
You should see a key with ID `9FD3B784BC1C6FC31A8A0A1C1655A0AB68576280` which will confirm this worked.
Now you need to change the permissions on this key:
```sh
chmod a+r /usr/share/keyrings/nodesource.gpg
```
##### Add Repository from NodeSource
Now we will add the desired NodeSource repository.
```sh
VERSION=node_16.x
KEYRING=/usr/share/keyrings/nodesource.gpg
DISTRO="$(lsb_release -s -c)"
echo "deb [signed-by=$KEYRING] https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee /etc/apt/sources.list.d/nodesource.list
echo "deb-src [signed-by=$KEYRING] https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list
```
Now we can update our APT repositories and then install NodeJS.
```sh
sudo apt update && apt upgrade
apt install nodejs
```
#### Set up Gunicorn

Now we will install further required packages on the system.
```sh
apt install python3-django python3-virtualenv libpq-dev python3.10-venv
```
Next, we will create the gunicorn user and group on the system.
```sh
sudo groupadd gunicorn
useradd gunicorn -g gunicorn
```
Next we will create the configuration file for Gunicorn on our site.  You must create the file here: `/var/www/mathesar.example.com/gunicorn_conf.py` and copy the following code into it.  Pay attention as you have to edit the code according to your FQDN / URL.

```sh
errorlog = '/var/log/gunicorn/mathesar.example.com-error.log'
loglevel = 'info'
accesslog = '/var/log/gunicorn/mathesar.example.com-access.log'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
```
Next we will create the logging directory for Gunicorn and assign it to the gunicorn user & group.
```sh
sudo mkdir /var/log/gunicorn # Only if it does not exist already, but installation of Gunicorn should have created this and assigned to www-data user/group
chmod 0755 /var/log/gunicorn
chgrp gunicorn /var/log/gunicorn
chown gunicorn /var/log/gunicorn
```
Next we will create the Gunicorn systemd service.  You must create the file here: `/lib/systemd/system/gunicorn.service` and copy the following code into it.  Pay attention as you have to edit the code according to your FQDN / URL.
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
WorkingDirectory=/var/www/mathesar.example.com/mathesar
ExecStart=/bin/bash -c '/opt/virtualenvs/mathesar/bin/gunicorn -c /var/www/mathesar.example.com/gunicorn_conf.py config.wsgi:application'
EnvironmentFile=/etc/gunicorn-env

ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```
The permissions for the file must be 0644 so run this when you are done: `chmod 0644 /lib/systemd/system/gunicorn.service`

Next we will create the Gunicorn systemd socker.  You must create the file here: `/lib/systemd/system/gunicorn.socket` and copy the following code into it.  Pay attention as you have to edit the code according to your FQDN / URL.

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
The permissions for the file must be 0644 so run this when you are done: `chmod 0644 /lib/systemd/system/gunicorn.socket`

Next we will create the Gunicorn environment file for the service.  You must create the file here: `/etc/gunicorn-env` and copy the following code into it.  Pay attention as you have to edit the code according to your FQDN / URL.
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
#### Create the virtual environment

We need to create a virtual environment for the Mathesar application.  We will do this by running the following command:
```sh
python3.9 -m venv /opt/virtualenvs/mathesar
```

#### Clone the Mathesar repo

We can now clone the Mathesar repo into our working folder.
```sh
cd /var/www/mathesar.example.com/
git clone https://github.com/centerofci/mathesar.git
```
Once this is installed we will install from requirements.txt 
```sh
pip install -r requirements.txt
```
Next we will activate our virtual environment with the following command:
```sh
. /opt/virtualenvs/mathesar/bin/activate
```

We will call the Django Settings, and then apply the migration:
```sh
$(sudo cat /var/www/mathesar.examplecom/mathesar/.env)
python3.9 /var/www/mathesar.example.com/manage.py migrate

```
Once the migration is done, we need to build the static files.
Firstly, go to the mathesar_ui folder and run `npm i`:
```sh
cd /var/www/mathesar.example.com/mathesar_ui && npm i
```
You may be required to update / install additional packages and you can go ahead and to that.  Once this is done we can build our static files:
```sh
npm run build --max_old_space_size=4096
```


