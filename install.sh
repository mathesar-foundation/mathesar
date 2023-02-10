#!/usr/bin/env bash

mkdir mathesar
cd mathesar || exit
wget -O docker-compose.yml https://raw.githubusercontent.com/centerofci/mathesar/master/docker-compose.yml
echo "Generating Secret key..."
secret_key=$(tr -dc 'a-z0-9!@#$%^&*(-_=+)' < /dev/urandom | head -c50)
echo "Secret key generated successfully"
echo "Mathesar needs a Postgres database to store the metadata. We will be creating a database now"
read -r -p "Please enter the username to use for the database: " dj_db_username
read -r -p "Please enter the password to use for the database: " dj_db_password
read -r -p "Please enter the name of the metadata database: " dj_db_name
read -r -p "Please enter the port the database should listen on: " db_host
read -r -p "Enter the domain name under which Mathesar will be hosted. Skip if you are planning to host it locally: " allowed_hosts
read -r -p "Enter superuser username: " superuser_username
read -r -p "Enter superuser email: " superuser_email
read -r -s -p "Enter superuser password: " superuser_password
echo "We will be creating databases to store your data "
user_database_urls_lst=()
while true;
do
    read -r -p "Do you want to create a new Database Yes or no? " response
    if [[ $response =~ ^([yY][eE][sS]|[yY])$ ]]
    then
      read -r -p "Please enter the username to use for the database: " db_username
      read -r -p "Please enter the password to use for the database: " db_password
      read -r -p "Please enter the name of the metadata database: " db_name
      user_database_url="(mathesar_tables|postgresql://$db_username:$db_password@mathesar_db:5432/$db_name)"
    else
        exit 0
    fi
done
IFS=\| eval 'user_database_urls="${user_database_urls[*]}"'


read -r -p "Enter the database url you would like Mathesar to manage: " user_database_urls
read -r -p "Enter the http port for the Mathesar webserver to user [Defaults to port 80]: " http_port
read -r -p "Enter the https port for the Mathesar webserver to user [Defaults to port 443: " https_port
allowed_hosts=${allowed_hosts:-"*"}
http_port=${http_port:-80}
https_port=${https_port:-443}
tee .env <<EOF >/dev/null
POSTGRES_USER=$db_username
POSTGRES_PASSWORD=$db_password
POSTGRES_HOST=$db_host
ALLOWED_HOSTS=[$allowed_hosts]
SECRET_KEY=$secret_key
DJANGO_DATABASE_KEY=default
DJANGO_DATABASE_URL=postgres://$db_username:$db_password@mathesar_db:5432/mathesar_django
MATHESAR_DATABASES=$user_database_urls
DJANGO_SUPERUSER_PASSWORD=$superuser_password
HTTP_PORT=$http_port
HTTPS_PORT=$https_port
EOF
docker-compose --profile prod build
docker exec mathesar_service python install.py
docker exec mathesar_service python manage.py createsuperuser --no-input --username "$superuser_username" --email "$superuser_email"
docker-compose --profile prod up