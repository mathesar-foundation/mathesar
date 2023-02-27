#!/usr/bin/env bash
set -e
clear -x
github_tag=${1-master}
min_maj_docker_version=20
min_maj_docker_compose_version=2
min_min_docker_compose_version=7
shopt -s expand_aliases

## Functions ##################################################
get_nonempty () {
  local ret_str="${2}"
  local prompt="${1}: "
  if [ -n "${ret_str}" ]; then
    prompt="${1} [${2}]: "
  fi
  read -r -p "${prompt}"
  ret_str=${REPLY:-$ret_str}
  until [ -n "${ret_str}" ]; do
    read -r -p "This cannot be empty!
${prompt}" ret_str
  done
  echo "${ret_str}"
}

get_password () {
  local password
  local prompt="${1}: "
  local retry_prompt="
The password cannot be empty!
${prompt}"
  read -rs -p "${prompt}" password
  until [ -n "${password}" ]; do
    read -rs -p "${retry_prompt}" password
  done
  echo "${password}"
}

create_password () {
  local password
  local password_check
  local prompt="${1}Choose a password"
  local repeat_prompt="
Repeat the password: "
  local repeat_retry="
Passwords do not match! Try again.
"

  password=$(get_password "${prompt}")
  read -rs -p "${repeat_prompt}" password_check
  if [ "${password}" != "${password_check}" ]; then
    password=$(create_password "${repeat_retry}")
  fi
  echo "${password}"
}

configure_db_urls() {
  local default_db
  local db_host
  local db_port
  local db_username
  local db_password
  local prefix
  if [ "${1}" == preexisting ]; then
    prefix="Enter the"
    db_host=$(get_nonempty "${prefix} database host")
  else
    prefix="Choose a"
    default_db="mathesar"
    db_host=mathesar_db
  fi
  db_port=$(get_nonempty "${prefix} database connection port" "5432")
  if [ "${1}" != django_only ]; then
    db_name=$(get_nonempty "${prefix} database name" "${default_db}")
  fi
  db_username=$(get_nonempty "${prefix} username for the database" "${default_db}")
  if [ "${1}" == preexisting ]; then
    db_password=$(get_password "${prefix} password")
  else
    db_password=$(create_password)
  fi


  if [ "${1}" == preexisting ]; then
    mathesar_database_url="postgresql://${db_username}:${db_password}@${db_host}:${db_port}/${db_name}"
  elif [ "${1}" == django_only ]; then
    django_database_url="postgresql://${db_username}:${db_password}@${db_host}:${db_port}/mathesar_django"
    django_db_username="${db_username}"
    django_db_password="${db_password}"
    django_db_port="${db_port}"
  else
    mathesar_database_url="postgresql://${db_username}:${db_password}@${db_host}:${db_port}/${db_name}"
    django_database_url="postgresql://${db_username}:${db_password}@${db_host}:${db_port}/mathesar_django"
    django_db_username="${db_username}"
    django_db_password="${db_password}"
    django_db_port="${db_port}"
  fi
}
################################################################################

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

OPERATING SYSTEM CHECK

--------------------------------------------------------------------------------

"
if [ $(echo "${OSTYPE}" | head -c 5) == "linux" ]; then
  printf "Installing Mathesar for GNU/Linux.
"
  alias docker='sudo docker'
elif [ $(echo "${OSTYPE}" | head -c 6) == "darwin" ]; then
  printf "Installing Mathesar for macOS.
"
else
  printf "Operating System Unknown. Proceed at your own risk.
"
  alias docker='sudo docker'
fi
read -r -p "
Press ENTER to continue, or CTRL+C to cancel. "
clear -x

printf "
--------------------------------------------------------------------------------

DOCKER VERSION CHECK

We'll begin by making sure your Docker installation is up-to-date.  In order to
run some necessary commands, we need to use sudo for elevated privileges.

--------------------------------------------------------------------------------

"
sudo -k
sudo -v
docker_version=$(docker version -f '{{.Server.Version}}')
docker_compose_version=$(docker compose version --short)
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
Docker versions OK.

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

printf "
Would you like to connect an existing database or create a new database?
"
select CHOICE in "connect existing" "create new"; do
  case $CHOICE in
    "connect existing")
      printf "
WARNING: This will create a new PostgreSQL schema in the database for Mathesar's internal use.

"
      configure_db_urls preexisting
      printf "
Now we need to create a local database for Mathesar's internal use.
"
      configure_db_urls django_only
      break
      ;;
    "create new")
      configure_db_urls
      break
      ;;
    *)
      printf "\nInvalid choice.\n"
  esac
done
printf "\n"
clear -x
printf "
--------------------------------------------------------------------------------

WEBSERVER CONFIGURATION

Here, we configure the webserver that hosts Mathesar.

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
read -r -p "Choose a HTTP port for the webserver to use [80]: " http_port
http_port=${http_port:-80}
read -r -p "Choose a HTTP port for the webserver to use [443]: " https_port
https_port=${https_port:-443}
printf "Generating Django secret key...
"
secret_key=$(base64 /dev/urandom | head -c50)

printf "\n"
clear -x
printf "
--------------------------------------------------------------------------------

ADMIN USER CONFIGURATION

You'll use these credentials to login to Mathesar in the web interface.

--------------------------------------------------------------------------------

"

read -r -p "Choose an admin username [mathesar]: " superuser_username
superuser_username=${superuser_username:-mathesar}
superuser_email=$superuser_username@example.com
superuser_password=$(create_password)
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
POSTGRES_USER='$django_db_username'
POSTGRES_PASSWORD='$django_db_password'
POSTGRES_HOST='$django_db_port'
ALLOWED_HOSTS='$allowed_hosts'
SECRET_KEY='$secret_key'
DJANGO_DATABASE_KEY='default'
DJANGO_DATABASE_URL='${django_database_url}'
MATHESAR_DATABASES='(mathesar_tables|${mathesar_database_url})'
DJANGO_SUPERUSER_PASSWORD='$superuser_password'
DOMAIN_NAME='$domain_name'
HTTP_PORT='$http_port'
HTTPS_PORT='$https_port'
EOF
clear -x

printf "
--------------------------------------------------------------------------------

DOCKER SETUP

This step downloads and runs all needed Docker images and starts your Mathesar
installation.

--------------------------------------------------------------------------------

"
printf "Downloading docker-compose.yml...
"
sudo curl -sL -o docker-compose.yml https://raw.githubusercontent.com/centerofci/mathesar/"$github_tag"/docker-compose.yml
printf "Success!"
clear -x
docker compose --profile prod up -d --wait
clear -x
printf "
--------------------------------------------------------------------------------

Service is ready and healthy!
Adding admin user to Django webservice now.
"
docker exec mathesar_service python manage.py createsuperuser --no-input --username "$superuser_username" --email "$superuser_email"
read -r -p "Press ENTER to continue. "
printf "\n"
clear -x
if [ "${domain_name}" !=  ":80" ]; then
  padded_domain=" ${domain_name}"
elif [ -n "${ip_address}" ]; then
  padded_domain=" ${ip_address}"
fi
printf "
--------------------------------------------------------------------------------

Installation complete!

If running locally, you can login by navigating to http://localhost in your
web browser. If you set up Mathesar on a server, double-check that the
machine accepts traffic on the configured ports, and login at the configured
address%s.

Thank you for installing Mathesar.

" "$padded_domain"
read -r -p "Press ENTER to finish. "
clear -x
