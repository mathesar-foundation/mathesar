#!/usr/bin/env bash
set -e
clear -x
github_tag=${1-master}
printf "
********************************************************************************

Welcome to the Mathesar installer for version %s!

********************************************************************************

Let's begin.

" "$github_tag"

config_location=$HOME/.config/mathesar
mkdir -p "$config_location"
cd "$config_location"
printf "
Downloading docker-compose.yml...
"
wget -q -O docker-compose.yml https://raw.githubusercontent.com/centerofci/mathesar/"$github_tag"/docker-compose.yml
printf "
Generating Secret key...
"
secret_key=$(tr -dc 'a-z0-9!@#$%^&*(-_=+)\\' < /dev/urandom | head -c50)
printf "\
Secret key generated successfully.
"
printf "
Now, we'll create credentials for a database where Mathesar can store metadata.
This is different from the database where we'll store user tables.

"
read -r -p "Enter a username for the system database: " db_username
read -rs -p "Enter a password for the user: " db_password
printf "\n"
read -rs -p "Repeat the password: " db_password_check
while [ "$db_password" != "$db_password_check" ]; do
  printf "\nPasswords do not match! Try again.\n"
  read -rs -p "Enter a password for the user: " db_password
  printf "\n"
  read -rs -p "Repeat the password: " db_password_check
done

printf "

If you have a PostgreSQL database already running on this machine you may need
to choose a custom port for Mathesar's database to avoid conflict.

"
read -r -p "Enter a port for the database [5432]: " db_port
db_port=${db_port:-5432}

printf "
If you're planning to allow access to your Mathesar installation from the
internet, we need to configure the domain where you'll host Mathesar.

"
read -r -p "Enter the domain, or press ENTER to skip: " allowed_hosts
allowed_hosts=${allowed_hosts:-*}

printf "
Next, we need to set up an admin user for your Mathesar installation. This user
will be able to create other, less-privileged users after the installation is
complete. This could be different from the system database user, or you can use
the same details.

"
read -r -p "Enter the admin username: " superuser_username
superuser_email=$superuser_username@example.com
read -r -s -p "Enter the admin password: " superuser_password
printf "\n"
read -r -s -p "Repeat the password: " superuser_password_check
while [ "$superuser_password" != "$superuser_password_check" ]; do
  printf "\nPasswords do not match! Try again.\n"
  read -rs -p "Enter the admin password: " superuser_password
  printf "\n"
  read -rs -p "Repeat the password: " superuser_password_check
done

printf "

Now, we need to configure a database to store your data.

"
read -r -p "Please enter a name for the database [mathesar]: " db_name
db_name=${db_name:-mathesar}

printf "

Next, we configure some details of the webserver that lets your browser connect
to Mathesar. If you're not sure, just use the defaults.

"
read -r -p "Enter the http port for the Mathesar webserver to use [80]: " http_port
http_port=${http_port:-80}
read -r -p "Enter the https port for the Mathesar webserver to use [443]: " https_port
https_port=${https_port:-443}
printf "\n\n"
tee .env <<EOF
POSTGRES_USER='$db_username'
POSTGRES_PASSWORD='$db_password'
POSTGRES_HOST='$db_port'
ALLOWED_HOSTS='$allowed_hosts'
SECRET_KEY='$secret_key'
DJANGO_DATABASE_KEY='default'
DJANGO_DATABASE_URL='postgresql://$db_username:$db_password@mathesar_db:${db_port}/mathesar_django'
MATHESAR_DATABASES='(mathesar_tables|postgresql://$db_username:$db_password@mathesar_db:$db_port/$db_name)'
DJANGO_SUPERUSER_PASSWORD='$superuser_password'
HTTP_PORT='$http_port'
HTTPS_PORT='$https_port'
EOF

printf "
Configuration created successfully with the above settings, and stored at:

%s/.env

" "$config_location"

printf "
The next steps involve Docker. In order to run Docker commands, we need to use
sudo (for elevated privileges). If your system sudoers policy allows the caching
of sudo credentials, we'll do so. Otherwise, we'll ask for a password for each
relevant Docker command.

"
sudo -v
printf "
Pulling docker images...

"
sudo docker compose --profile prod pull
printf "
Starting the docker containers...

"
sudo docker compose --profile prod up -d --wait
printf "
Service is ready and healthy!

Adding admin user to Django webservice now.
"
sudo docker exec mathesar_service python manage.py createsuperuser --no-input --username "$superuser_username" --email "$superuser_email" 2> >(grep -vi warn)
printf "
Installation complete!

If running locally, you can access Mathesar by navigating to http://localhost
in your web browser.

Thank you for installing Mathesar!


"
