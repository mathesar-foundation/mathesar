# Connect to an external database server

1. On the existing database server, [create a new database](https://www.postgresql.org/docs/current/sql-createdatabase.html) for Mathesar to store its metadata.

    ```bash
    psql -c 'create database mathesar_django;'
    ```

1. Configure the [Internal database environment variables](./env-variables.md#db) to point to the database you just created.


## Connect to a database server running on the host {: #localhost-db }

!!! info ""
    This content is related to Mathesar running in Docker related environments. This is applicable for the previous Guided installation method, the [Docker Compose installation method](../installation/docker-compose/index.md), and the [Docker installation method](../installation/docker/index.md).

If you're running Mathesar in a Docker related environment, and your database server runs on the host machine, you will not be able to connect to it using `localhost:<db_port>`, since `localhost` would refer to the Docker environment and not to the host.

You can try using `host.docker.internal` instead of `localhost`. Below are detailed instructions to expose the database on your host to the Docker instance.

### Prerequisites

1. Locate `postgresql.conf` & `pg_hba.conf` file on the host machine. This can be located using `psql` shell by executing the following respectively.

    ```
    SHOW config_file;
    ```

    and

    ```
    SHOW hba_file;
    ```
1. Create the necessary network bridges using docker-compose

    ```
    docker compose -f docker-compose.yml up service -d --no-start
    ```

1. Find the appropriate IP addresses of the `docker0` interface and the `mathesar_default` interface. This can be found by exectuting the following in the host's terminal.
    {% raw %}
    ```
    docker network inspect -f "docker0 IP: {{range .IPAM.Config}}{{.Gateway}}{{end}}" bridge && docker network inspect -f "mathesar_default IP: {{range .IPAM.Config}}{{.Subnet}}{{end}}" mathesar_default
    ```
    {% endraw %}

1. Stop Mathesar if it's already running.


### Steps

1. Edit the `postgresql.conf` file and add the IP of `docker0` interface in the `listen_addresses` setting. Uncomment this line if it's conmmented out.

    ```
    listen_addresses = 'localhost, <your-docker0-ip>'
    ```

1. Modify the `pg_hba.conf` file and grant access to the `mathesar_default` interface. Add the following line at the bottom of the file:

    ```
    host    all             all             <your-mathesar_default-ip>           md5
    ```

1. Restart postgres:
    
    === "Linux"
        ```
        sudo systemctl restart postgresql
        ```
    === "MacOS"
        ```
        sudo brew services restart postgresql
        ```

1. Set the value of [`MATHESAR_DATABASES` environment variable](./env-variables.md#mathesar_databases) to the following:

    ```
    MATHESAR_DATABASES=(<unique_id>|postgresql://<user_name>:<password>@host.docker.internal:<port-no>/<host_db_name>)
    ```

1. If your Mathesar installation is Docker Compose based, add an extra host for the prod container in the `docker-compose.yml` file:

    ```
    extra_hosts:
          - "host.docker.internal:<your-docker0-ip>"
    ```

1. Start Mathesar.

You should have a successful connection to the host database now!
