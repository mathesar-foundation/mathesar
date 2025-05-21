# Install Mathesar from Scratch

!!! warning "For experienced system administrators"
    This guide assumes you are comfortable with the command line, package management
    and basic database administration on **Linux** or **macOS** (or **WSL 2** on Windows).
    If you hit any snags, please [open an issue](https://github.com/mathesar-foundation/mathesar/issues/new/choose)
    or send a PR against [this page](https://github.com/mathesar-foundation/mathesar/blob/master/docs/docs/administration/install-from-scratch.md).

## Requirements

- **Hardware:**
    - ≥ 60 GB disk
    - ≥ 4 GB RAM *(Recommended)*
- **OS:**
    - Should work on most modern Linux distributions and macOS versions.
    - Tested on **Debian 12**, **Ubuntu 22.04**, **Fedora 40**, and **macOS 14**.
    - On Windows, install under **WSL 2** (Ubuntu or Debian).
- **Software:**
    - PostgreSQL 13+
- **Privileges:**
    - You'll need access to a PostgreSQL role with `CREATE USER` and `CREATE DATABASE` privileges.
    - Some optional deployment steps require `sudo` privileges.

## Installation

### Set up Mathesar's internal database

These steps create Mathesar's [internal database](../user-guide/databases.md#internal) so Mathesar can store metadata about your data.

1. Open a `psql` shell.

    ```sh
    sudo -u postgres psql
    ```

    _(Modify as necessary based on your Postgres installation.)_

1. Create a Postgres user for Mathesar.

    ```postgresql
    CREATE USER mathesar WITH ENCRYPTED PASSWORD 'strong‑pw‑here';
    ```

    !!! warning "Use a real password"
        Replace `strong‑pw‑here` with something private and record it—you’ll need it below.

1. Create a database for storing Mathesar metadata. The Postgres user you created in the previous step should be the `OWNER` of this database.

    ```postgresql
    CREATE DATABASE mathesar_django OWNER mathesar;
    ```

1. Press <kbd>Ctrl</kbd>+<kbd>D</kbd> to exit the `psql` shell.

### Set up your installation directory

1. Choose a directory where you will install Mathesar.

    For example: `$HOME/mathesar`, or `/etc/mathesar`, or `/opt/mathesar`.

1. Enter your installation directory into the box below and press <kbd>Enter</kbd> to personalize this guide:

    <input data-input-for="MATHESAR_INSTALL_DIR" aria-label="Your Mathesar installation directory"/>

1. Ensure your installation directory exists and has the proper permissions.

    ```bash
    mkdir -p "xMATHESAR_INSTALL_DIRx"
    chown "$(id -u):$(id -g)" "xMATHESAR_INSTALL_DIRx"
    ```

1. Move inside the installation directory.

    ```bash
    cd "xMATHESAR_INSTALL_DIRx"
    ```

### Run the install script

1. Download the install script and make it executable:

    ```bash
    curl -sSfL https://github.com/mathesar-foundation/mathesar/releases/download/{{mathesar_version}}/install.sh -o install.sh
    chmod +x install.sh
    ```

1. Run it, **pointing at the Postgres DB you created**:

    ```bash
    ./install.sh . \
      -c "postgres://mathesar:strong‑pw‑here@localhost:5432/mathesar_django"
    ```

    - Any valid PostgreSQL connection string can be used as the argument for `-c`.

    - If your PostgreSQL installation runs over the unix socket, you could use:

        ```
        postgres://mathesar:strong‑pw‑here/mathesar_django?host=/var/run/postgresql
        ```

    ??? info "Additional install script options"
        | Flags | Purpose |
        |-------|---------|
        | `-h` &nbsp; `--help`                  | Show help |
        | `-c` &nbsp; `--connection-string`     | Non‑interactive DB setup |
        | `-n` &nbsp; `--no-prompt`             | Fail instead of prompting (CI) |
        | `-f` &nbsp; `--force-download-python` | Always download Python 3.13 even if system Python is OK |

1. When it's successful you’ll see:

    > Mathesar's installed successfully!

    The script attempts to add the Mathesar executable to your PATH. If it succeeds, you'll see:

    > Everything's ready, you can now start Mathesar by executing "mathesar run".

    If setting the PATH fails, it'll show instructions on how to add the mathesar executable to your PATH. Follow those instructions.

### Run Mathesar

1. Open a new shell and verify the installation:

    - This should print your Mathesar version:

        ```
        mathesar version
        ```

    - This should print help content:

        ```
        mathesar help
        ```

1. Start Mathesar:

    ```
    mathesar run
    ```

1. You can now access Mathesar by navigating to `http://localhost:8000`.

## Deployment

The steps below convert your installation into a public-facing production service with a Caddy reverse‑proxy to handle HTTPS.

!!! note "Optional - Server hosting only"
    Follow this section if you want Mathesar to run continuously on a server and be reachable by other users (with or without a public domain). For personal use, evaluation, or on‑prem workstations you can simply start Mathesar on demand with `mathesar run` and skip ahead to the First‑time access section.

!!! note "Linux-only"
    - The steps below rely on **systemd** and therefore **only target Linux servers**.
    - On macOS you can adapt these steps to `launchd` if you need to run mathesar as a service.
    - On Windows, deploy from a Linux VM or WSL 2.

!!! note "Elevated permissions needed"
    Most of the commands below need to be run as a root user, or using `sudo`. If you try to run one of these commands, and see an error about "permission denied", run again with elevated privileges.

### Add a systemd unit

These steps create a systemd unit file, making it easy to start and stop the Mathesar service along with other services on your server.

1. Create a user for running Mathesar

    ```
    groupadd mathesar && \
    useradd mathesar -g mathesar
    ```

1. Make the `mathesar` user the owner of the `.media` directory

    ```
    chown -R mathesar:mathesar .media/
    ```

1. Create the Mathesar SystemD service file.

    ```
    touch /lib/systemd/system/mathesar.service
    ```

    and copy the following code into it.

    ```text
    [Unit]
    Description=mathesar daemon
    After=network.target network-online.target
    Requires=network-online.target
    
    [Service]
    Type=notify
    User=mathesar
    Group=mathesar
    RuntimeDirectory=mathesar
    WorkingDirectory="xMATHESAR_INSTALL_DIRx"
    ExecStart=/bin/bash -c '"xMATHESAR_INSTALL_DIRx"/bin/mathesar run'
    EnvironmentFile=xMATHESAR_INSTALL_DIRx/.env
    
    [Install]
    WantedBy=multi-user.target
    ```

1. Reload `systemctl` and start the Mathesar service

    ```
    systemctl daemon-reload
    systemctl start mathesar.service
    systemctl enable mathesar.service
    ```

1. Check the logs to verify if Mathesar is running without any errors
    
    ```
    journalctl --unit=mathesar.service
    ```

### Set up your domain name

!!! info "Optional"
    This section is optional. You can skip these steps if you only plan to use Mathesar from `localhost`.

1. Make sure your DNS `A` and/or `AAAA` records resolve to your server.

1. Enter your domain and press <kbd>Enter</kbd> to customize the remaining steps in this guide.

    <input data-input-for="DOMAIN_NAME" aria-label="Your Domain name "/>

    - For example:

        `example.com`

    - Do _not_ precede your domain with `https://`
    - Do _not_ use a trailing slash

### Add Environment variables

Add the following environment variables to the `.env` file in your Mathesar installation (located at `xMATHESAR_INSTALL_DIRx/.env`):

```
ALLOWED_HOSTS="xDOMAIN_NAMEx"
DOMAIN_NAME="xDOMAIN_NAMEx"
```

You can refer the list of [environment variables](./environment-variables.md) to configure Mathesar.

!!! tip
    To host Mathesar on multiple domains/subdomains simply list the domain names separated by a comma and a whitespace to the following env variables: 
    ```
    DOMAIN_NAME="xDOMAIN_NAMEx, xDOMAIN_NAMEx.example.org"
    ALLOWED_HOSTS="xDOMAIN_NAMEx, xDOMAIN_NAMEx.example.org"
    ```


### Configure Caddy

1. Create the CaddyFile

    ```
    touch /etc/caddy/Caddyfile
    ```

2. Add the configuration details to the CaddyFile

    ```
    {$DOMAIN_NAME} {
        log {
            output stdout
        }
        respond /caddy-health-check 200
        encode zstd gzip
        handle_path /media/* {
            @downloads {
                query dl=*
            }
            header @downloads Content-disposition "attachment; filename={query.dl}"
    
            file_server {
                precompressed br zstd gzip
                root {$MEDIA_ROOT:"xMATHESAR_INSTALL_DIRx/.media/"}
            }
        }
        handle_path /static/* {
            file_server {
                precompressed br zstd gzip
                root {$STATIC_ROOT:"xMATHESAR_INSTALL_DIRx/static/"}
            }
        }
        reverse_proxy localhost:8000
    }
    ```

1. Create a user for running Caddy

    ```
    groupadd caddy && \
    useradd caddy -g caddy
    ```

1. Create the Caddy systemd service file.

    ```
    touch /lib/systemd/system/caddy.service
    ```

    and copy the following code into it.

    ```
    [Unit]
    Description=Caddy
    Documentation=https://caddyserver.com/docs/
    After=network.target network-online.target
    Requires=network-online.target
    
    [Service]
    Type=notify
    User=caddy
    Group=caddy
    EnvironmentFile=xMATHESAR_INSTALL_DIRx/.env
    ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile
    ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force
    TimeoutStopSec=5s
    LimitNOFILE=1048576
    LimitNPROC=512
    PrivateTmp=true
    ProtectSystem=full
    AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
    
    [Install]
    WantedBy=multi-user.target
    ```


1. Reload the systemctl and start the Caddy socket

    ```
    systemctl daemon-reload && \
    systemctl start caddy.service && \
    systemctl enable caddy.service
    ```

1. Check the logs to verify if Caddy is running without any errors
    
    ```
    journalctl --unit=caddy.service
    ```

Caddy will obtain and renew Let’s Encrypt certificates automatically.

## User setup

1. Use your web browser to navigate to your Mathesar URL.

    - **With a domain** `https://xDOMAIN_NAMEx`
    - **Without**    `http://<server‑ip>:8000`

1. Follow the on‑screen wizard to create the first admin account and start using Mathesar!
