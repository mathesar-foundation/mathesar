# Upgrade Mathesar

The upgrade instructions vary depending on the [installation method](../index.md#installing-mathesar) you chose. Select your installation method below to proceed.

- [Upgrade a **Docker compose** installation of Mathesar](../installation/docker-compose/index.md#upgrade)
- [Upgrade a **Guided script** installation of Mathesar](../installation/docker-compose/index.md#upgrade)
- [Upgrade a **Manual source** installation of Mathesar](#upgrade-source)

### Installed from source {:#upgrade-source}

1. Go to your Mathesar installation directory.

    ```sh
    cd xMATHESAR_INSTALLATION_DIRx
    ```

    !!! note
        Your installation directory may be different from above if you used a different directory when installing Mathesar.

1. Pull the latest version from the repository

    ```sh
    git pull https://github.com/mathesar-foundation/mathesar.git
    ```

1. Update Python dependencies

    ```sh
    pip install -r requirements.txt
    ```

1. Next we will activate our virtual environment:

    ```sh
    source ./mathesar-venv/bin/activate
    ```

1. Update your environment variables according to the [the new configuration specification](../configuration/env-variables.md#db). In particular, you must put the connection info for the internal DB into new `POSTGRES_*` variables. The `DJANGO_DATABASE_URL` variable is no longer supported.

1. Add the environment variables to the shell before running Django commands

    ```sh
    export $(sudo cat .env)
    ```

1. Run the latest Django migrations

    ```sh
    python manage.py migrate
    ```

1. Install the frontend dependencies

    ```sh
    npm ci --prefix mathesar_ui
    ```
      
1. Build the Mathesar frontend app

    ```sh
    npm run --prefix mathesar_ui build --max_old_space_size=4096
    ```

1. Update Mathesar functions on the database:

    ```sh
    python mathesar/install.py --skip-confirm >> /tmp/install.py.log
    ```

1. Restart the gunicorn server

    ```sh
    sudo systemctl restart gunicorn
    ```



