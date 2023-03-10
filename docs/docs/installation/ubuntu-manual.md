# Manual install on Ubuntu 22

Installation should only take a few minutes.

## What we will do:
- Prepare the server
- Install Docker & Docker-compose
- Install PostgreSQL
- Install Nginx webserver    
- You need to be a user with root access to the machine you're trying to install Mathesar on.  We will use mathesar.example.com as the URL for our website.

## Preparing our server.
- Prerequisites
    - Ubntu 22 with at least `60 GB` disk space and `4GB` of RAM.
    - Root privileges
    
### Step one: Prepare the server
First, we need to update the software repository and upgrade all packages using the apt command below.  SSH to your server and elevate to the `root` user.
```sh
apt update && apt upgrade
```
Once the system has been updated, I recommend you perform a reboot to get the new kernel running incase it was updated.
Next we will install the required packages.
```sh
apt install locales build-essential acl ntp git python3-pip ipython3
```
Now we need to add a new usergroup and allow passwordless login:
```sh
sudo groupadd deployers \
useradd deployer \
usermod -a -G deployers deployer
```
Now you need to edit the `/etc/sudoers` file with the 'visudo' command, and add this line:  `deployer ALL=(ALL) NOPASSWD: ALL` under the `# User privilege specification` section.  If it fails to save, then edit again and move that to the last line of the file.  Remember to use TAB between the username and the first `ALL` section


### Step two: Install Docker & Docker-compose
Clean the system of any potential pre-installed Docker packages.
```sh
apt-get remove docker docker-engine docker.io
```
Now that we are sure there is no pre-configured or installed Docker on the system, we can begin the installation.
Firstly, we have to install the required Docker dependencies on the system:
```sh
sudo apt -y install apt-transport-https ca-certificates curl gnupg2 software-properties-common
```
The next step is to add Docker's official GPG key to the keyring.  This is to ensure the validity of downloaded Docker packages from it's repository.
```sh
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```
Now that the key is added, we can add the stable repo for Docker. 
```sh
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```
We have to update the system:
```sh
apt update
```
We can now install Docker using the following command:
```sh
apt-get install docker-ce docker-ce-cli containerd.io
```
Once installation is completed, you can run the following commands to make sure that Docker is running, and that it will start with the system.
```sh
systemctl enable docker && systemctl start docker
```

##### Install Docker-compose
We will install Docker-compose next.  We will start by downloading the latest Docker-compose version.
```sh
sudo curl -L "https://github.com/docker/compose/releases/download/2.16.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```
Once downloaded, we have to change the properties so that it is an executable:

```sh
sudo chmod +x /usr/local/bin/docker-compose
```
That is it.  We can now move to the next step.

### Step Three: Install PostGreSQL
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
#### Create Database, Database user
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


### Step Four: Install Nginx with Letsencrypt and Gurnicorn3
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
Now, we can add our custom directives to the file.  You can copy/paste this in your terminal and run it.
```sh
echo "server_tokens off;

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
}" > /etc/nginx/sites-enabled/http
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

sudo apt-get install gunicorn3
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
  server_name {{ main_domain_name }};

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

With this in place, we can not install the SSL certificate for our domain.  You can run this command:
```sh
letsencrypt certonly -n --webroot -w /var/www/letsencrypt -m you@mathesar.example.com --agree-tos -d mathesar.example.com
```
Now that the SSL certificate is installed, lets create a cron job so that it gets renewed once a week.  From the command you will see `0 0 * * FRI` and this means it will renew at 00:00 every Friday.
```sh
echo "0 0 * * FRI     root    letsencrypt certonly -n --webroot -w /var/www/letsencrypt -m marius@mathesar.cloudnation.co.za --agree-tos -d mathesar.cloudnation.co.za" >> /etc/crontab
```
Wait three minutes, and then check whether your cron file edit is valid by running the following command:
```sh
grep cron /var/log/syslog | tail -10
```
If you see ` (*system*) RELOAD (/etc/crontab)` without any error message attached, you did this correctly.

Lastly, we will also generate the dhparams for Nginx:
```sh
openssl dhparam -dsaparam -out /etc/nginx/dhparams.pem 2048
```

va
