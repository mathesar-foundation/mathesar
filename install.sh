#!/usr/bin/env bash
set -e
clear -x
github_tag=${1-master}
min_maj_docker_version=20
min_maj_docker_compose_version=2
min_min_docker_compose_version=7
shopt -s expand_aliases

## Functions ###################################################################

percent_encode_reserved () {
  # We need to be able to percent-encode any characters which are reserved in
  # the URI spec given by RFC-3986, as well as '|', ' ', and '%'
  # See https://datatracker.ietf.org/doc/html/rfc3986#section-2.2
  local reserved='|:/?#[]@!$&'"'"'()*+,;=% '
  for (( i=0; i<${#1}; i++ )); do
    local c="${1:$i:1}"
    if [[ -z "${reserved##*"$c"*}"  ]]; then
      # $c is in the reserved set, convert to hex Note that the '02' in the
      # formatting is not technically needed, since all reserved characters are
      # greater than 10 (greater than 20, actually). We'll leave it this way to
      # avoid potential future problems.
      printf '%%%02X' "'${c}"
    else
      printf "%s" "${c}"
    fi
  done
}

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

get_db_host () {
  local prefix="${1}"
  local db_host
  db_host=$(get_nonempty "${prefix} database host")
  while [ "${db_host:0:3}" == "127" ] || [ "${db_host}" == "localhost" ]; do
    echo "Databases on localhost are not supported by this installation method." >&2
    db_host=$(get_nonempty "${prefix} database host")
  done
}

configure_db_urls () {
  local default_db
  local db_host
  local db_port
  local db_username
  local db_password
  local prefix
  if [ "${1}" == preexisting ]; then
    prefix="Enter the"
    db_host=$(get_db_host "${prefix}")
    enc_db_host=$(percent_encode_reserved "${db_host}")
  else
    prefix="Choose a"
    default_db="mathesar"
    enc_db_host=mathesar_db
  fi
  db_port=$(get_nonempty "${prefix} database connection port" "5432")
  if [ "${1}" != django_only ]; then
    db_name=$(get_nonempty "${prefix} database name" "${default_db}")
    enc_db_name=$(percent_encode_reserved "${db_name}")
  fi
  if [ "${1}" != preexisting ] && [ "${1}" != django_only ]; then
    printf "
Note: We will use the same user credentials across all databases created by Mathesar.

"
  fi
  db_username=$(get_nonempty "${prefix} username for the database" "${default_db}")
  enc_db_username=$(percent_encode_reserved "${db_username}")
  if [ "${1}" == preexisting ]; then
    db_password=$(get_password "${prefix} password")
  else
    db_password=$(create_password)
  fi
  enc_db_password=$(percent_encode_reserved "${db_password}")

  if [ "${1}" == preexisting ]; then
    mathesar_database_url="postgresql://${enc_db_username}:${enc_db_password}@${enc_db_host}:${db_port}/${enc_db_name}"
  elif [ "${1}" == django_only ]; then
    django_database_url="postgresql://${enc_db_username}:${enc_db_password}@${enc_db_host}:5432/mathesar_django"
    django_db_username="${db_username}"
    django_db_password="${db_password}"
    django_db_port="${db_port}"
  else
    mathesar_database_url="postgresql://${enc_db_username}:${enc_db_password}@${enc_db_host}:5432/${enc_db_name}"
    django_database_url="postgresql://${enc_db_username}:${enc_db_password}@${enc_db_host}:5432/mathesar_django"
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
if [ "$(echo "${OSTYPE}" | head -c 5)" == "linux" ]; then
  printf "Installing Mathesar for GNU/Linux.
"
  alias docker='sudo docker'
elif [ "$(echo "${OSTYPE}" | head -c 6)" == "darwin" ]; then
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

installation_fail () {
  printf "
Unfortunately, the installation has failed.

We'll print some error logs above that will hopefully point you to the
problem.

A common issue is for there to be some networking issue outside of Mathesar's
control. Please:
- Make sure you can reach your preexisting DB from this machine, if relevant.
- Make sure you have access to https://raw.githubusercontent.com/

If you can't get things working, please raise an issue at

https://github.com/centerofci/mathesar/issues/
" >&2

  if [ "${1}" == "late" ]; then
    read -r -p "
    Press ENTER to print the logs and reset the local docker environment. "
    docker compose --profile prod logs
    docker compose --profile prod down -v --rmi all
  fi
  read -r -p "
Press ENTER to exit the installer. "
  exit 1
}

printf "
--------------------------------------------------------------------------------

DOCKER VERSION CHECK

We'll begin by making sure your Docker installation is up-to-date. In order to
run some necessary commands, we need to use sudo for elevated privileges.

--------------------------------------------------------------------------------

"
sudo -k
sudo -v
docker_version=$(docker version -f '{{.Server.Version}}')
docker_compose_version=$(docker compose version --short)
printf "
Your Docker version is %s.
Your Docker Compose version is %s. " "$docker_version" "$docker_compose_version"
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
      printf "\n"
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
read -r -p "Enter the domain name of the webserver, or press ENTER to skip: " domain_name
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
printf "\n"
read -r -p "Choose a HTTP port for the webserver to use [80]: " http_port
http_port=${http_port:-80}
read -r -p "Choose a HTTP port for the webserver to use [443]: " https_port
https_port=${https_port:-443}
printf "Generating Django secret key...
"
secret_key=$(xxd -ps -c0 -l30 /dev/urandom)

printf "\n"
clear -x
printf "
--------------------------------------------------------------------------------

ADMIN USER CONFIGURATION

You'll use these credentials to login to Mathesar in the web interface.

--------------------------------------------------------------------------------

"

read -r -p "Choose an admin username [admin]: " superuser_username
superuser_username=${superuser_username:-admin}
read -r -p "Choose an admin email [$superuser_username@example.com]: " superuser_email
superuser_email=${superuser_email:-"$superuser_username@example.com"}
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
The environment file will be installed at %s/.env

" "$config_location"

read -r -p "Press ENTER to continue. "
sudo mkdir -p "${config_location}"
cd "${config_location}"
sudo tee .env > /dev/null <<EOF
POSTGRES_USER='${django_db_username}'
POSTGRES_PASSWORD='${django_db_password}'
POSTGRES_PORT='${django_db_port}'
ALLOWED_HOSTS='${allowed_hosts}'
SECRET_KEY='${secret_key}'
DJANGO_DATABASE_KEY='default'
DJANGO_DATABASE_URL='${django_database_url}'
MATHESAR_DATABASES='(mathesar_tables|${mathesar_database_url})'
DJANGO_SUPERUSER_PASSWORD='${superuser_password}'
DOMAIN_NAME='${domain_name}'
HTTP_PORT='${http_port}'
HTTPS_PORT='${https_port}'
EOF
sudo chmod 640 .env
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
sudo curl -sfL -o docker-compose.yml https://raw.githubusercontent.com/centerofci/mathesar/"${github_tag}"/docker-compose.yml || installation_fail early
read -r -p "Success!

Next, we'll download files and start the server, This may take a few minutes.

Press ENTER to continue. "
clear -x
docker compose --profile prod up -d --wait || installation_fail late
printf "\n"
printf "
--------------------------------------------------------------------------------

Service is ready and healthy!
Adding admin user to Django webservice now.
"
docker exec mathesar_service python manage.py createsuperuser --no-input --username "$superuser_username" --email "$superuser_email"
read -r -p "
Press ENTER to continue. "
printf "\n"
if [ "${domain_name}" !=  ":80" ]; then
  padded_domain=" ${domain_name}"
elif [ -n "${ip_address}" ]; then
  padded_domain=" ${ip_address}"
fi
clear -x
printf "
--------------------------------------------------------------------------------

THANK YOU

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
