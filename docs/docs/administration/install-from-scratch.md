# Install & Deploy Mathesar (Linux · macOS · WSL)

!!! warning "For experienced *nix administrators"
    This guide assumes you are comfortable with the command line, package management
    and basic database administration on **Linux or macOS** (or **WSL 2** on Windows).
    If you hit any snags, please [open an issue](https://github.com/mathesar-foundation/mathesar/issues/new/choose)
    or send a PR against [this page](https://github.com/mathesar-foundation/mathesar/blob/master/docs/docs/installation/build-from-source/index.md).

---

## 1 · Installation

### 1.1 · Requirements

| Category | Details |
|----------|---------|
| **Hardware** | ≥ 60 GB disk, ≥ 4 GB RAM *(Recommended)* |
| **OS** | Tested on **Debian 12**, **Ubuntu 22.04**, **Fedora 40**, and **macOS 14**. <br/>Should work on most modern Linux distributions and macOS versions. <br/>On Windows, install under **WSL 2** (Ubuntu or Debian). |
| **Privileges** | You need sufficient privileges to write to the installation directory. |
| **Software** | Postgres 13+ |

### 1.2 · Set up the database for storing Mathesar metadata

1. Open a `psql` shell.

    ```
    sudo -u postgres psql  # Modify based on your Postgres installation.
    ```

1. Create a Postgres user for Mathesar

    ```postgresql
    CREATE USER mathesar WITH ENCRYPTED PASSWORD 'strong‑pw‑here';
    ```

    !!! warning "Use a real password"
        Replace `strong‑pw‑here` with something private and record it—you’ll need it below.

1. Create a database for storing Mathesar metadata. Your PostgreSQL user will either need to be the `OWNER` of this database.

    ```postgresql
    CREATE DATABASE mathesar_django OWNER mathesar;
    ```

1. Press <kbd>Ctrl</kbd>+<kbd>D</kbd> to exit the `psql` shell.

### 1.3 · Choose an installation directory

1. Pick a directory (examples: `$HOME/mathesar`, `/etc/mathesar`, `/opt/mathesar`).
1. Type that directory here and press <kbd>Enter</kbd> to personalise this guide:
   <input data-input-for="MATHESAR_INSTALL_DIR" aria-label="Your Mathesar installation directory"/>
1. Create and chown it if it doesn’t exist:
```bash
mkdir -p "xMATHESAR_INSTALL_DIRx"
chown "$(id -u):$(id -g)" "xMATHESAR_INSTALL_DIRx"
```
1. Move inside the installation directory.
```bash
cd "xMATHESAR_INSTALL_DIRx"
```

### 1.4 · Download & Run the installer script

1. Download and make the script executable:
```bash
curl -sSfL https://raw.githubusercontent.com/mathesar-foundation/mathesar/{{mathesar_version}}/scripts/install.sh -o install.sh
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
      postgres://mathesasr:strong‑pw‑here/mathesar_django?host=/var/run/postgresql
      ```

1. When it's successful you’ll see:
```bash
Mathesar's installed successfully!
```
The script would attempt to add the Mathesar executable to your PATH. If it succeeds, you'll see:
```
Everything's ready, you can now start Mathesar by executing "mathesar run".
```
If setting the PATH fails, it'll show instructions on how to add the mathesar executable to your PATH. Follow those instructions.

### 1.5 · Run Mathesar

1. Open a new shell and verify the installation:
```bash
mathesar version     # should print "Mathesar version {{mathesar_version}}"
mathesar help        # should print help content
```

1. Start Mathesar:
```bash
mathesar run
```

1. You can now access Mathesar by navigating to `http://localhost:8000`.

---

## 2 · Deployment (systemd + Caddy reverse‑proxy)

!!! note "Optional - Server hosting only"
    Follow this section if you want Mathesar to run continuously on a server and be reachable by other users (with or without a public domain). For personal use, evaluation, or on‑prem workstations you can simply start Mathesar on demand with `mathesar run` and skip ahead to the First‑time access section.

!!! note "Linux-only"
    The steps below rely on **systemd** and therefore **only target Linux servers**.<br/>
    On macOS you can adapt these steps to `launchd` if you need to run mathesar as a service.<br/>
    On Windows, deploy from a Linux VM or WSL 2.

!!! note "Elevated permissions needed"
    Most of the commands below need to be run as a root user, or using `sudo`. If you try to run one of these commands, and see an error about "permission denied", run again with elevated privileges.

The steps below convert the working installation into a production service with HTTPS.

### 2.1 · Create a systemd unit for running Mathesar as a service

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

### 2.2 · (Optional) Point a domain to the server

Make sure your DNS A/AAAA records resolve to this machine before continuing.

Type the domain (no trailing slash) and press <kbd>Enter</kbd>: <input data-input-for="DOMAIN_NAME" aria-label="Your Domain name "/>

### 2.3 · Add Environment variables

Add the following environment variables to the .env file in your Mathesar installation (located at `xMATHESAR_INSTALL_DIRx/.env`):
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


### 2.4 · Configure Caddy

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

---

## 3 · First‑time access

Navigate to:

- **With a domain** `https://xDOMAIN_NAMEx`
- **Without**    `http://<server‑ip>:8000`

Follow the on‑screen wizard to create the first admin account and start using Mathesar!

---

## Useful script flags (CI / advanced)

| Flag | Purpose |
|------|---------|
| `-c / --connection-string` | Non‑interactive DB setup |
| `-n / --no-prompt`         | Fail instead of prompting (CI) |
| `-f / --force-download-python` | Always download Python 3.13 even if system Python is OK |

Run `./install.sh -h` for the full list.
