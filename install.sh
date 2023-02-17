#!/usr/bin/env bash
set -e
clear -x
github_tag=${1-master}
printf "
--------------------------------------------------------------------------------

Welcome to the Mathesar installer for version %s!

For more information or explanation about the steps involved, please see:

https://docs.mathesar.org/installation/docker-compose/#installation-steps

--------------------------------------------------------------------------------

" "$github_tag"
read -r -p "Press ENTER to begin. "
clear -x
printf "
--------------------------------------------------------------------------------

DATABASE CONFIGURATION

Here, we configure the PostgreSQL database(s) for Mathesar. These credentials
can be used to login directly using psql or another client.

--------------------------------------------------------------------------------

"
read -r -p "Choose a database name [mathesar]: " db_name
db_name=${db_name:-mathesar}

read -r -p "Choose a username [mathesar]: " db_username
db_username=${db_username:-mathesar}

read -rs -p "Choose a password for the user: " db_password
until [ -n "$db_password" ]; do
  printf "\nThe password cannot be empty!\n"
  read -rs -p "Choose a password for the user: " db_password
done
printf "\n"
read -rs -p "Repeat the password: " db_password_check
while [ "$db_password" != "$db_password_check" ]; do
  printf "\nPasswords do not match! Try again.\n"
  read -rs -p "Choose a password for the user: " db_password
  until [ -n "$db_password" ]; do
    printf "\nThe password cannot be empty!\n"
    read -rs -p "Choose a password for the user: " db_password
  done
  printf "\n"
  read -rs -p "Repeat the password: " db_password_check
done
printf "\n"
read -r -p "Choose a port for local database access [5432]: " db_port
db_port=${db_port:-5432}

printf "\n"
clear -x
printf "
--------------------------------------------------------------------------------

WEBSERVER CONFIGURATION

Here, we set up details of the Mathesar webserver.

--------------------------------------------------------------------------------

"

read -r -p "Choose a domain for the webserver, or press ENTER to skip: " allowed_hosts
allowed_hosts=${allowed_hosts:-*}
read -r -p "Choose an http port for the webserver to use [80]: " http_port
http_port=${http_port:-80}
read -r -p "Choose an https port for the webserver to use [443]: " https_port
https_port=${https_port:-443}
printf "Generating Django secret key...
"
secret_key=$(base64 -w 0 /dev/urandom | head -c50)

printf "\n"
clear -x
printf "
--------------------------------------------------------------------------------

ADMIN USER CONFIGURATION

You'll use these credentials to login to Mathesar in the web interface for the
first time.

--------------------------------------------------------------------------------

"

read -r -p "Choose an admin username [mathesar]: " superuser_username
superuser_username=${superuser_username:-mathesar}
superuser_email=$superuser_username@example.com
read -rs -p "Choose a password for the admin user: " superuser_password
until [ -n "$superuser_password" ]; do
  printf "\nThe password cannot be empty!\n"
  read -rs -p "Choose a password for the admin user: " superuser_password
done
printf "\n"
read -rs -p "Repeat the password: " superuser_password_check
while [ "$superuser_password" != "$superuser_password_check" ]; do
  printf "\nPasswords do not match! Try again.\n"
  read -rs -p "Choose a password for the admin user: " superuser_password
  until [ -n "$superuser_password" ]; do
    printf "\nThe password cannot be empty!\n"
    read -rs -p "Choose a password for the admin user: " superuser_password
  done
  printf "\n"
  read -rs -p "Repeat the password: " superuser_password_check
done

printf "\n"
clear -x
config_location=$HOME/.config/mathesar
printf "
--------------------------------------------------------------------------------

We'll store a file with the configurations you've defined at:

%s/.env

" "$config_location"

read -r -p "Press ENTER to continue. "
clear -x

mkdir -p "$config_location"
cd "$config_location"

cat > .env <<EOF
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
--------------------------------------------------------------------------------

DOCKER SETUP

This step download and run all needed Docker images and start your Mathesar
installation.

In order to run Docker commands, we need to use sudo (for elevated privileges).

--------------------------------------------------------------------------------

"
sudo -v
printf "Downloading docker-compose.yml...
"
wget -q -O docker-compose.yml https://raw.githubusercontent.com/centerofci/mathesar/"$github_tag"/docker-compose.yml
printf "Success!"
clear -x
sudo docker compose --profile prod up -d --wait
clear -x
printf "
--------------------------------------------------------------------------------

Service is ready and healthy!
Adding admin user to Django webservice now.
"
sudo docker exec mathesar_service python manage.py createsuperuser --no-input --username "$superuser_username" --email "$superuser_email" 2> >(grep -vi warn)
read -r -p "Press ENTER to continue. "
printf "\n"
clear -x
printf "
--------------------------------------------------------------------------------

Installation complete!

If running locally, you can access Mathesar by navigating to http://localhost
in your web browser.

Thank you for installing Mathesar.

"
read -r -p "Press ENTER to finish. "
clear -x
