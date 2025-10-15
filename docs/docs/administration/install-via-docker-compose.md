# Install Mathesar via Docker Compose

## Prerequisites

{% include 'snippets/docker-compose-prerequisites.md' %}


## Step-by-Step Guide {: #steps}

!!!note
    Depending on your Docker setup, you may need to run `docker` commands with `sudo`.

<!-- ???info "Video walkthrough (Click to expand)"
    <iframe width=100% height=480px src="https://www.youtube.com/embed/0AFfvrUMkas?si=tZkhRHXBqS-sqyto" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe> -->

1. Download our [docker-compose.yml](https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml) file.

    ```
    wget https://github.com/mathesar-foundation/mathesar/raw/{{mathesar_version}}/docker-compose.yml
    ```

1. Open the downloaded docker-compose file using your text editor.

1. Set the required environment variables in the **x-config** section of the docker compose file:

    !!! Config
        ```yaml
        x-config: &config
          # (Optional) Replace 'http://localhost' with custom domain(s) e.g.
          # 'yourdomain.com, 127.0.0.1' to manage the host(s) at which you want to
          # access Mathesar over http or https
          DOMAIN_NAME: ${DOMAIN_NAME:-http://localhost}

          # Edit the POSTGRES_* variables if you are not using the db service provided
          # below, or if you want to use a custom database user.

          # (Optional) Replace 'mathesar_django' with any custom name for the internal
          # database managed by mathesar web-service
          POSTGRES_DB: ${POSTGRES_DB:-mathesar_django}

          # (Optional) Replace 'mathesar' with any custom username for the
          # aforementioned database
          POSTGRES_USER: ${POSTGRES_USER:-mathesar}

          # (Optional) Replace 'mathesar' with any custom password for the
          # aforementioned database
          POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-mathesar}

          # (Optional) Replace 'mathesar_db' with the name of the host running postgres
          POSTGRES_HOST: ${POSTGRES_HOST:-mathesar_db}

          # (Optional) Replace '5432' with the port on which postgres is running
          POSTGRES_PORT: ${POSTGRES_PORT:-5432}
        ```

1. (Optional) set a `SECRET_KEY` for the Mathesar service.

    By default, Mathesar will set up and persist a `SECRET_KEY` value for your installation. However, if you're on a serverless environment or using a production platform with an ephemeral filesystem, you must [set a secret key via environment variable](/administration/environment-variables/#secret_key) so that it persists between service builds.

2. (Optional) Enable and configure optional features:
    - [Single sign-on (SSO)](./single-sign-on.md)
    - [File data type](./file-backend-config.md)
3. Run the docker compose file using:
        ```
        docker compose -f docker-compose.yml up
        ```

4. Set up your user account

    Mathesar is now installed! You can use it by visiting `localhost` or the domain you've set up. You'll be prompted to set up an admin user account the first time you open Mathesar. Just follow the instructions on screen.

## Starting and stopping Mathesar {:#start-stop}

The Mathesar server needs to be running for you to use Mathesar. If you restart your machine, you'll need to start the server again.

- **Start** Mathesar:

    ```
    docker compose -f docker-compose.yml up -d
    ```

    !!! Info
        Exclude the `-d` flag if you'd like to see the container's logs.

- **Stop** Mathesar:

    ```
    docker compose -f docker-compose.yml down
    ```

    This stops all Mathesar Docker containers and releases their ports.

## Optional configurations

### Hosting Mathesar over a custom domain with https

If you want Mathesar to be accessible over the internet, you'll probably want to set up a domain or sub-domain to use. **If you don't need a domain, you can skip this section.**

**Ensure that the DNS for your domain or sub-domain is pointing to the public IP address of the machine that you're installing Mathesar on**.

Add your domain(s) or sub-domain(s) to the [`DOMAIN_NAME`](./environment-variables.md#domain_name) environment variable, in the **CONFIG** section of the docker-compose file.

!!! example
    ```yaml
    DOMAIN_NAME: ${DOMAIN_NAME:-yourdomain.org, yoursubdomain.example.org}
    ```

Restart the docker containers for the configuration to take effect.

### Modifying the number of Gunicorn workers

If you're deploying Mathesar in a production or multi-user environment, you may want to increase the number of Gunicorn workers to improve performance and handle more concurrent requests.

You can control this by adjusting the `WEB_CONCURRENCY` environment variable in the **CONFIG** section of the docker-compose file. [Learn more about the recommended value](./environment-variables.md#web_concurrency) on our ENV variables page.

### Using an external PostgreSQL server for Mathesar's internal database

If you'd like to use an external PostgreSQL server for Mathesar's internal database, you'll need to do the following:


1. On your PostgreSQL server, [create a new database](https://www.postgresql.org/docs/current/sql-createdatabase.html) for Mathesar to store its metadata.

    ```bash
    psql -c 'create database mathesar_django;'
    ```

1. Configure the [internal database environment variables](./environment-variables.md#db) to point to the database you just created. Ensure that you change the default values for the user, password, and host.

#### Docker Host Networking Considerations

When connecting to PostgreSQL running on the Docker host machine over the network (TCP/IP), remember the following:

- Using `localhost` within Docker will reference the container itself, not your host.
- On macOS or Windows, `host.docker.internal` typically works to access the host network.
- On Linux, you _can_ use `host.docker.internal`, but it must be explicitly configured in your docker compose file like so:
  ```yaml
  extra_hosts:
    - "host.docker.internal:host-gateway"
  ```
    -  Alternatively, try the Docker network gateway IP (`172.17.0.1`) or your host machine's local network IP.


#### Connecting via Unix Socket

If you're connecting Mathesar to PostgreSQL via a Unix socket, ensure the following:

- Set `POSTGRES_HOST` to the directory containing your PostgreSQL Unix socket (typically `/var/run/postgresql`).
- You may omit `POSTGRES_PORT` if using the default value (`5432`), but must specify it when using a non-standard port.
- Adjust your PostgreSQL server permissions (`pg_hba.conf`) to allow socket connections using appropriate authentication for the `POSTGRES_USER`  (such as `md5`). Refer to [PostgreSQL Authentication docs](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html) for more information.
- In Docker, mount the Unix socket directory as a volume to enable container access. For example:

```yaml
 service:
    container_name: mathesar_service
    image: mathesar/mathesar:latest
    volumes:
       # Add this line
       - /var/run/postgresql:/var/run/postgresql
```
