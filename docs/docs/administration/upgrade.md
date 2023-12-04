# Upgrade Mathesar

## Upgrade Mathesar via the web interface

!!! note
    In-app upgrades are only possible after installing Mathesar via our [**guided script**](../installation/guided-install/index.md) or our [**Docker compose**](../installation/docker-compose/index.md) instructions.

1. Open the Settings menu at the top right of the screen, and click on **Administration**.
1. You should now see the "Software Update" page.
1. If a new version of Mathesar can be installed automatically, then you will see a "New Version Available" box containing an **Upgrade** button. Click the button to begin the upgrade, and follow the on-screen instructions after that.

## Upgrade Mathesar via the command line

The upgrade instructions vary depending on the [installation method](../index.md#installing-mathesar) you chose. Select your installation method below to proceed.

- [Upgrade a **Docker compose** installation of Mathesar](../installation/docker-compose/index.md#upgrade)
- [Upgrade a **Docker** installation of Mathesar](../installation/docker/index.md#upgrade)


## Upgrading deprecated Mathesar installations


### Installed from guided install
<!-- TODO -->


### Installed from source

1. Go to your Mathesar installation directory.

    ```sh
    cd xMATHESAR_INSTALLATION_DIRx
    ```

    !!! note
        Your installation directory may be different from above if you used a different directory when installing Mathesar.

1. Pull the latest version from the repository

    ```sh
    git pull https://github.com/centerofci/mathesar.git
    ```

1. Update Python dependencies

    ```sh
    pip install -r requirements.txt
    ```

1. Next we will activate our virtual environment:

    ```sh
    source ./mathesar-venv/bin/activate
    ```

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
