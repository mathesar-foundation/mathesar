#!/usr/bin/env bash
set -e
clear -x
github_tag=${1-master}
min_maj_docker_version=20
min_maj_docker_compose_version=2
min_min_docker_compose_version=7
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

DOCKER VERSION CHECK

We'll begin by making sure your Docker installation is up-to-date.  In order to
run Docker commands, we need to use sudo for elevated privileges.

--------------------------------------------------------------------------------

"
sudo -k
sudo -v
docker_version=$(sudo docker version -f '{{.Server.Version}}')
docker_compose_version=$(sudo docker compose version --short)
printf "
Your Docker version is %s.
Your Docker Compose version is %s.
" "$docker_version" "$docker_compose_version"

docker_maj_version=$(echo "$docker_version" | tr -d '[:alpha:]' | cut -d '.' -f 1)
docker_compose_maj_version=$(echo "$docker_compose_version" | tr -d '[:alpha:]' | cut -d '.' -f 1)
docker_compose_min_version=$(echo "$docker_compose_version" | tr -d '[:alpha:]' | cut -d '.' -f 2)

if [ "$docker_maj_version" -lt "$min_maj_docker_version" ]; then
  printf "
Docker must be at least version %s.0.0 and
Docker Compose must be at least version %s.%s.0!
Please upgrade.

" "$min_maj_docker_version" "$min_maj_docker_compose_version" "$min_min_docker_compose_version"
  exit 1
fi

if [ "$docker_compose_maj_version" -lt "$min_maj_docker_compose_version" ]; then
  printf "
Docker Compose must be at least version %s.%s.0! Please upgrade.

" "$min_maj_docker_compose_version" "$min_min_docker_compose_version"
  exit 1
elif [ "$docker_compose_maj_version" -eq "$min_maj_docker_compose_version" ] &&
[ "$docker_compose_min_version" -lt "$min_min_docker_compose_version" ]; then
  printf "
Docker Compose must be at least version %s.%s.0! Please upgrade.

" "$min_maj_docker_compose_version" "$min_min_docker_compose_version"
  exit 1
fi

printf "
Docker versions ok.

"
read -r -p "Press ENTER to continue. "
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

allowed_hosts=".localhost, 127.0.0.1"
read -r -p "Enter the domain of the webserver, or press ENTER to skip: " domain_name
if [ -z "${domain_name}" ]; then
  read -r -p "Enter the external IP address of the webserver, or press ENTER to skip: " ip_address
  domain_name=':80'
fi
if [ -n "${ip_address}" ]; then
  allowed_hosts="${ip_address}, ${allowed_hosts}"
elif [ "${domain_name}" != ':80' ]; then
  allowed_hosts="${domain_name}, ${allowed_hosts}"
else
  printf "
No domain or external IP address configured.
Only local connections will be allowed.
"
  read -r -p "Press ENTER to continue. "
fi
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
printf "
--------------------------------------------------------------------------------

CONFIGURATION DIRECTORY

Mathesar needs to create a configuration directory on your machine. Using the
default is strongly recommended. If you choose a custom location, write it down.

--------------------------------------------------------------------------------

"
read -r -p "Choose a configuration directory [/etc/mathesar]: " config_location
config_location="${config_location:-/etc/mathesar}"

printf "
Installing environment file at %s/.env

" "$config_location"

read -r -p "Press ENTER to continue. "
sudo mkdir -p "$config_location"
cd "$config_location"
sudo tee .env > /dev/null <<EOF
POSTGRES_USER='$db_username'
POSTGRES_PASSWORD='$db_password'
POSTGRES_HOST='$db_port'
ALLOWED_HOSTS='$allowed_hosts'
SECRET_KEY='$secret_key'
DJANGO_DATABASE_KEY='default'
DJANGO_DATABASE_URL='postgresql://$db_username:$db_password@mathesar_db:${db_port}/mathesar_django'
MATHESAR_DATABASES='(mathesar_tables|postgresql://$db_username:$db_password@mathesar_db:$db_port/$db_name)'
DJANGO_SUPERUSER_PASSWORD='$superuser_password'
DOMAIN_NAME='$domain_name'
HTTP_PORT='$http_port'
HTTPS_PORT='$https_port'
EOF
clear -x

printf "
--------------------------------------------------------------------------------

DOCKER SETUP

This step download and run all needed Docker images and start your Mathesar
installation.

--------------------------------------------------------------------------------

"
printf "Downloading docker-compose.yml...
"
sudo wget -q -O docker-compose.yml https://raw.githubusercontent.com/centerofci/mathesar/"$github_tag"/docker-compose.yml
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
if [ "${domain_name}" !=  ":80" ]; then
  padded_domain=" ${domain_name}"
fi
printf "
--------------------------------------------------------------------------------

Installation complete!

If running locally, you can login by navigating to http://localhost in your
web browser. If you set up Mathesar on a server, double-check that the
machine accepts traffic on the configured ports, and login at the configured
domain%s.

Thank you for installing Mathesar.

" "$padded_domain"
read -r -p "Press ENTER to finish. "
clear -x
