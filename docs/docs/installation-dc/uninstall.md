# Uninstalling Mathesar

Please follow these steps to uninstall Mathesar.

## Remove Docker images

Here's the command to remove all the Docker images and containers set up during installation.

=== "Linux"
    ```sh
    sudo docker compose -f /etc/mathesar/docker-compose.yml --profile prod down --rmi all -v
    ```

=== "MacOS"
    ```sh
    docker compose -f /etc/mathesar/docker-compose.yml --profile prod down --rmi all -v
    ```

## Remove configuration files

Go to the configuration directory that you chose during installation. Replace `/etc/mathesar` in the command below if you chose a different directory.

```sh
sudo rm -rf /etc/mathesar
```

## Remove Mathesar internal schemas
!!!info
    This step only applies **if you connected Mathesar to an existing database during installation**. 

If you connected Mathesar to an existing database, the installation process would have created a new schema for Mathesar's use. You can remove this schema from the databases by:

#### 1. Connecting to the database
```
psql -h <DB HOSTNAME> -p <DB PORT> -U <DB_USER> <DB_NAME>
```

#### 2. Deleting the schema
!!! danger 
    Deleting this schema will also delete any database objects that depend on it. This should not be an issue if you don't have any data using Mathesar's custom data types.

```postgresql
DROP SCHEMA mathesar_types CASCADE;
```