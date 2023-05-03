# Connecting Mathesar to a host database

## Prerequisites

1. Locate `postgresql.conf` & `pg_hba.conf` file on the host machine. This can be located using `psql` shell by executing the following respectively.

    ```
    SHOW config_file;
    ```

    and

    ```
    SHOW hba_file;
    ```

2. Find the appropriate IP addresses of the `docker0` interface and the `mathesar_default` interface. This can be found by exectuting the following in the host's terminal.

    ```
    docker network inspect -f "docker0 IP: {{range .IPAM.Config}}{{.Gateway}}{{end}}" bridge && docker network inspect -f "mathesar_default IP: {{range .IPAM.Config}}{{.Subnet}}{{end}}" mathesar_default
    ```

3. Locate the `docker-compose.yml` & `.env` file on the host machine, by default it is located at `/etc/mathesar`.

4. Stop Mathesar if already running:

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml --profile prod down
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml --profile prod down
        ```


## Steps

1. Edit the `postgresql.conf` file and add the IP of `docker0` interface in the `listen_addresses` setting. Uncomment this line if it's conmmented out.

    ```
    listen_addresses = 'localhost, <your-docker0-ip>'
    ```

2. Modify the `pg_hba.conf` file and grant access to the `mathesar_default` interface. Add the following line at the bottom of the file:

    ```
    host    all             all             <your-mathesar_default-ip>           scram-sha-256
    ```

3. Add an extra host for the prod container in the `docker-compose.yml` file:

    ```
    extra_hosts:
          - "host.docker.internal:<your-docker0-ip>"
    ```

4. Set the appropriate environment variables in the `.env` file to establish the connection to the host database. Replace the `MATHESAR_DATABASES` env variable to the following:

    ```
    MATHESAR_DATABASES=(mathesar_tables|postgresql://<user_name>:<password>@host.docker.internal:<port-no>/<host_db_name>)
    ```

    If the host db is running on port 5432 you would need to add the following in the `.env` file:

    ```
    POSTGRES_PORT=<unused-port-on-host(e.g. 5555)> 
    ```

5. Restart postgres:
    
    === "Linux"
        ```
        sudo systemctl restart postgresql
        ```
    === "MacOS"
        ```
        sudo brew services restart postgresql
        ```

6. Start Mathesar:

    === "Linux"
        ```
        sudo docker compose -f /etc/mathesar/docker-compose.yml --profile prod up -d
        ```

    === "MacOS"
        ```
        docker compose -f /etc/mathesar/docker-compose.yml --profile prod up -d
        ```

You should have a successful connection to the host database now!