# Install Mathesar directly on Linux · macOS · WSL

!!! warning "For experienced system administrators"
    This guide assumes you are comfortable with the command line, package management
    and basic database administration on **Linux** or **macOS** (or **WSL 2** on Windows).
    If you hit any snags, please [open an issue](https://github.com/mathesar-foundation/mathesar/issues/new/choose)
    or send a PR against [this page](https://github.com/mathesar-foundation/mathesar/blob/master/docs/docs/administration/install-from-scratch.md).

## Requirements

- **Hardware:**
    - ≥ 60 GB disk.
    - ≥ 4 GB RAM. *(Recommended)*
- **OS:**
    - Should work on most modern Linux distributions and macOS versions.
    - Tested on **Debian 12**, **Ubuntu 22.04**, and **macOS 14**.
    - On Windows, install under **WSL 2** (Ubuntu or Debian).
- **Software:**
    - [PostgreSQL](https://www.postgresql.org/download/) 13 or newer.

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
    CREATE USER mathesar WITH ENCRYPTED PASSWORD 'strong‑pw‑here' CREATEDB;
    ```

    !!! warning "Use a real password"
        Replace `strong‑pw‑here` with a strong, private password and make a note of it, you’ll need it later.

    !!! tip
        About the extra privileges in the command:

        - **`CREATEDB`: gives the Postgres user permission to create new databases.**
            - It’s handy if you want Mathesar admins to spin up databases from the web interface.
            - Don’t need that capability? Just remove `CREATEDB` from the command, everything else will still work.

        - **`CREATEROLE`: allows the Postgres user to create and manage other Postgres roles.**
            - If you’d like Mathesar admins to handle role management (create, drop, alter roles) from the web interface, add this attribute as well:
            ```postgresql
            CREATE USER mathesar WITH ENCRYPTED PASSWORD 'strong-pw-here' CREATEDB CREATEROLE;
            ```

        - You could refer to [the official Postgres documentation](https://www.postgresql.org/docs/17/sql-createrole.html) to learn more about these attributes.

        _(Both attributes are optional, so feel free to include only what matches your comfort level.)_

1. Create a database for storing Mathesar metadata. The Postgres user you created in the previous step should be the `OWNER` of this database.

    ```postgresql
    CREATE DATABASE mathesar_django OWNER mathesar;
    ```

1. Press <kbd>Ctrl</kbd>+<kbd>D</kbd> to exit the `psql` shell.

### Set up your installation directory

1. Choose a directory where you will install Mathesar.

    For example: `/home/your_user_name/mathesar`, or `/etc/mathesar`

1. Enter your installation directory into the box below and press <kbd>Enter</kbd> to personalize this guide:

    <input data-input-for="MATHESAR_INSTALL_DIR" aria-label="Your Mathesar installation directory"/>

    - Do _not_ include a trailing slash.
    - Do _not_ use any variables like `$HOME`.

1. Create your installation directory and ensure it has proper permissions.

    ```bash
    mkdir -p "xMATHESAR_INSTALL_DIRx"
    chown "$(id -u):$(id -g)" "xMATHESAR_INSTALL_DIRx"
    ```

    !!! note "When installing outside your home folder"
        If you choose a directory outside your home folder, like **/etc/mathesar** or **/opt/mathesar**, you’ll need super-user rights for this step:

        ```bash
        sudo mkdir -p /etc/mathesar
        sudo chown <desired-owner>:<desired-group> /etc/mathesar
        ```

        *Choose an owner that makes sense for your setup:*

        - **`root`**: if only admins will touch the files
        - **your own user**: if you’ll run everything yourself
        - **a dedicated `mathesar` user**: nice for shared or production servers

        The remainder of this guide requires you to **run commands with full permissions inside your installation directory**.

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

1. Run it, **pointing at the Postgres DB and user you created earlier**:

    ```bash
    ./install.sh . \
      -c "postgres://mathesar:strong‑pw‑here@localhost:5432/mathesar_django"
    ```

    - Any valid [PostgreSQL connection string](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS) can be used as the argument for `-c`. Here are some examples:
        ```
        postgres://mathesar:strong‑pw‑here@localhost:5432/mathesar_django

        # As parameters
        postgres:///mathesar_django/?host=localhost&port=5432&user=mathesar&password=strong‑pw‑here

        # Over Unix domain sockets
        postgres://mathesar:strong‑pw‑here@/mathesar_django?host=/var/run/postgresql

        # Non-standard port over Unix domain sockets
        postgres://mathesar:strong‑pw‑here@%2Fvar%2Flib%2Fpostgresql:5455/mathesar_django
        ```

    ??? info "Additional install script options"
        | Flags | Purpose |
        |-------|---------|
        | `-h` &nbsp; `--help`                  | Show help |
        | `-c` &nbsp; `--connection-string`     | Non‑interactive DB setup |
        | `-n` &nbsp; `--no-prompt`             | Fail instead of prompting (CI) |
        | `-f` &nbsp; `--force-download-python` | Always download Python even if system Python is OK |

1. When it's successful, you’ll see:

    > Mathesar's installed successfully!

    The script attempts to add the `mathesar` executable to **your** `PATH`.

    If that works you’ll also see:

    > Everything's ready, you can now start Mathesar by executing "mathesar run".

    You may have to open a new terminal (or re-source your shell profile) for the change to take effect.

    If the script can’t update your `PATH`, it will provide you instructions on how to add it yourself.

    !!! tip "Tip: Want to allow *all* system users to run Mathesar?"
        For security purposes, the installer only sets up the command and necessary permissions for the user who runs it.

        To make `mathesar` available system-wide,

        - Create a symlink in `/usr/local/bin`:
            ```bash
            sudo ln -s "xMATHESAR_INSTALL_DIRx/bin/mathesar" /usr/local/bin/mathesar
            ```
        - Provide read access to the installation directory and it's contents to all users.
            ```bash
            sudo chmod -R a+rX xMATHESAR_INSTALL_DIRx
            ```
        - Provide write access to the `.media` directory within `xMATHESAR_INSTALL_DIRx` to all users.
            ```bash
            sudo chmod -R a+rwX xMATHESAR_INSTALL_DIRx/.media
            ```

### Run Mathesar

1. Open a new shell and verify the installation. This command should print your Mathesar version.

    ```bash
    mathesar version
    ```

1. Start Mathesar:

    ```bash
    mathesar run
    ```

1. You can now access Mathesar by navigating to `http://localhost:8000`.

## Deployment

Turn your local Mathesar installation into a public-facing production service.

!!! note "Optional - Server hosting only"
    - Follow this section if you want Mathesar to run continuously on a server and be reachable by other users (with or without a public domain).
    - For personal use, evaluation, or on‑prem workstations, you can simply start Mathesar on demand with `mathesar run` and skip ahead to setting up your user account.
    - See our [guide to setting up single sign-on (SSO)](./single-sign-on.md) if that's of interest to you.
    - Consider [configuring a file backend](./file-backend-config.md) to enable the file data type.

!!! note "Linux-only"
    - The steps below **only target Linux servers** that use **systemd**.
    - On macOS, you can adapt the service portion to `launchd`.
    - On Windows, deploy from a Linux VM or WSL 2.

!!! note "Elevated permissions needed"
    Most of the commands below need to be run as a root user, or using `sudo`. If you try to run one of these commands, and see an error about "permission denied", run again with elevated privileges.

!!! note "Gunicorn worker configuration"
    By default Mathesar will use `3` Gunicorn sync workers. You may wish to adjust this if you're running Mathesar on a more powerful machine with additional vCPU cores. [See our recommendations for the `WEB_CONCURRENCY` env var to learn more](./environment-variables.md#web_concurrency).

### Run Mathesar as a systemd service

These steps create a systemd service to run Mathesar continuously - 24x7.

Before proceeding, stop Mathesar if it's currently running.

1. Create a dedicated user for running Mathesar.

    ```
    sudo groupadd mathesar && \
    sudo useradd mathesar -g mathesar
    ```

1. Make the `mathesar` user the owner of the `.media` directory within Mathesar's installation folder.

    ```
    sudo chown -R mathesar:mathesar "xMATHESAR_INSTALL_DIRx/.media/"
    ```

1. Write the systemd unit.

    ```
    cat <<'EOF' | sudo tee /etc/systemd/system/mathesar.service >/dev/null
    [Unit]
    Description=mathesar daemon
    After=network.target network-online.target
    Requires=network-online.target

    [Service]
    Type=notify
    User=mathesar
    Group=mathesar
    RuntimeDirectory=mathesar
    WorkingDirectory=xMATHESAR_INSTALL_DIRx
    ExecStart=/bin/bash -c 'xMATHESAR_INSTALL_DIRx/bin/mathesar run'
    EnvironmentFile=xMATHESAR_INSTALL_DIRx/.env
    Restart=on-failure
    RestartSec=5s

    [Install]
    WantedBy=multi-user.target
    EOF
    ```

1. Reload `systemctl` and start the Mathesar service.

    ```
    sudo systemctl daemon-reload
    sudo systemctl start mathesar.service
    sudo systemctl enable mathesar.service
    ```

1. Check the logs to verify if Mathesar is running without any errors.

    ```
    journalctl --unit=mathesar.service
    ```

### Serve over HTTPS with a domain

These steps put Caddy in front of Mathesar as a reverse proxy, serving the app over HTTPS while automatically fetching and renewing Let’s Encrypt certificates.

If you prefer nginx or another proxy, please refer to their documentation.

!!! info "Optional"
    You can skip this if you only plan to use Mathesar from `localhost`. The following steps assume that you have a domain name.

#### Set your domain

1. Ensure that your DNS `A` and/or `AAAA` records are configured correctly. Your domain should resolve to your server's IP.

1. Enter your domain and press <kbd>Enter</kbd> to customize the remaining steps in this guide.

    <input data-input-for="MATHESAR_DEPLOY_DOMAIN_NAME" aria-label="Your Domain name "/>

    - For example: `example.com`
    - Do _not_ precede your domain with `http://` or `https://`
    - Do _not_ use a trailing slash

    !!! tip
        To specify multiple domains/subdomains, type in the domain names separated by a comma. Make sure that there are no whitespaces between them:

        - For example: `localhost,example.com,subdomain.example.com`

#### Configure `ALLOWED_HOSTS`

- Add the environment variable `ALLOWED_HOSTS` to the end of the `.env` file in your Mathesar installation (located at `xMATHESAR_INSTALL_DIRx/.env`):
  ```
  ALLOWED_HOSTS=xMATHESAR_DEPLOY_DOMAIN_NAMEx
  ```
- If there multiple values for `ALLOWED_HOSTS`, they should be comma-separated, with no spaces.
- Please refer to the list of [environment variables](./environment-variables.md) to further configure Mathesar.
- Once the environment variables are configured, restart the Mathesar service:
  ```
  sudo systemctl restart mathesar.service
  ```

#### Install and configure Caddy {:#install-and-configure-caddy}

1. Install Caddy by following the instructions from the [Caddy documentation](https://caddyserver.com/docs/install).

1. Create/modify the [Caddyfile](https://caddyserver.com/docs/caddyfile) at `/etc/caddy/Caddyfile`, with the following content:

    ```
    # The below line specifies your domain names
    xMATHESAR_DEPLOY_DOMAIN_NAMEx {

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
          root "xMATHESAR_INSTALL_DIRx/.media/"
        }
      }

      handle_path /static/* {
        file_server {
          precompressed br zstd gzip
          root "xMATHESAR_INSTALL_DIRx/static/"
        }
      }

      # This is the address at which Mathesar is running
      reverse_proxy localhost:8000
    }
    ```

1. Most Caddy installation methods automatically set up Caddy to run as a service, with a systemd unit and a user account. You can verify it by running:
    ```
    systemctl status caddy.service
    ```
    If you encounter any error mentioning that the service is not found, you can manually set up a service by following [their documentation](https://caddyserver.com/docs/running#manual-installation).

1. Restart the Caddy service.

    ```
    sudo systemctl restart caddy.service
    ```

1. Check the logs to verify if Caddy is running without any errors

    ```
    journalctl --unit=caddy.service
    ```

## Set up your user account

1. Use your web browser to navigate to your Mathesar URL.

    - **With a domain** `https://xMATHESAR_DEPLOY_DOMAIN_NAMEx`
    - **Without**    `http://localhost:8000`

1. Follow the on‑screen wizard to create the first admin account and start using Mathesar!

## Troubleshooting

If you encounter any issues during the installation or while running Mathesar, try the troubleshooting steps below.

If you're unable to resolve the problem, feel free to reach out through our [community channels](https://mathesar.org/community) or [report a bug](https://github.com/mathesar-foundation/mathesar/issues/new?template=bug_report.md) on our Github repository.

- **Installer stops with “Permission denied” / mkdir fails**

    _Possible cause_: Installing into a root-owned directory without privileges.

    _Resolution_: Re-run the command with sudo, or install in a directory you have write privileges on.

- **Installer fails while building Python dependencies**

    _Possible cause_: Build tools/headers are not present in your environment.

    _Resolution_:

    - Run the install script with `-f` flag to force download a self contained python distributable.
    - Or, install build tools: `build-essential python3-dev libpq-dev` in your environment.

- **Paths with spaces break service**

    _Possible cause_: Missing escapes in commands & unit files.

    _Resolution_:

    - Always escape spaces in systemd unit files.
    - Eg., `WorkingDirectory=/etc/mathesar\ install\ dir`

- **Caddy returning blank page / 502**

    _Possible causes_:

    - Caddy does not have permissions to read `/static` folder.
    - Mathesar is not running or has crashed.

    _Resolution_:

    - Ensure that the Caddy service user has read permissions on the `static` folder and its contents within your installation directory.
    - If Mathesar has crashed, check the logs to investigate the error.

- **Uploading CSV fails (500 error)**

    _Possible cause_: `.media` folder not writable by Mathesar service or other users.

    _Resolution_:

    - Ensure that the Mathesar service user has write permissions on the `.media` folder and its contents within your installation directory.
    - If Mathesar was installed system-wide, ensure other users of the system have write permissions on the `.media` folder and it's contents.

- **Browser shows “Not Secure” / HTTP padlock**

    _Possible causes_:

    - Using plain HTTP.
    - Using an IP address instead of a domain name in Caddyfile.

    _Resolution_:

    - Serve Mathesar over HTTPS using Caddy.
    - Make sure that you mention a valid domain name in the Caddyfile, and not an IP address.
    - Ensure that your A/AAAA records are configured correctly so that your domain name resolves to your server's IP address.
