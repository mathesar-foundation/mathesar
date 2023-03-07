# Docker Compose installation system requirements

!!! info "We are still testing the install process"
    We've tested this installation procedure on Windows, Mac, and a few Linux variants, but this is our first release so there might be unexpected issues. Please open a [GitHub issue](https://github.com/centerofci/mathesar/issues) if you run into any problems.

## For all installations

- Install [Docker](https://docs.docker.com/desktop/) and [Docker Compose](https://docs.docker.com/compose/install/).

    !!! note "Docker versions"
        We've tested with Docker v23 and Docker Compose v2.10. Older versions may not work.

- Ensure you have root access.

## When using a custom domain name

- Have your domain name ready during the installation process and have your DNS pointing to your Mathesar server.

## When connecting to an existing database

- Ensure the external database can accept network connections from your Mathesar server.

- Have the following information handy before installation:

    - Database hostname

        _Cannot be `localhost`. (We'll add support for this in a future release.)_

    - Database port
    - Database name
    - Database username
    
        _The user should exist and be a `SUPERUSER`. ([More info](https://www.postgresql.org/docs/13/sql-createrole.html))_

    - Database password


## When installing on Windows {:#windows}

!!! warning
    The process of installing and running has thus far been much better tested on MacOS and Linux than it has on Windows. Please [open issues](https://github.com/centerofci/mathesar/issues/new/choose) for any Windows-specific problems you encounter.

1. Run the [Docker Desktop installer](https://docs.docker.com/desktop/install/windows-install/).

    - During installation, choose "WSL 2" instead of "Hyper-V". WSL is the Windows Sub System for Linux and is required to run Mathesar.

- After the Docker install finishes, open a DOS Command Prompt (from Windows) and run the following command:

    ```
    wsl --update
    ```

    !!! note "Notes"
        - Depending on your permission, for this step and future steps, you may need to right-click the DOS Command Prompt menu choice and select Run as Administrator to elevate the prompts permissions.
        - `update` is prefaced by two hyphen characters

1. Restart the PC after the WSL update finishes.

1. Open a new DOS Command Prompt and enter and run the following command to install Ubuntu (the default distribution for WSL):

    ```
    wsl --install -d Ubuntu
    ```

    !!! note "Notes"
        - During the installation you will need to provide an Ubuntu administrator name and password.  It is common to use `ubuntu` for both. Remember both as the Mathesar installer will need them. 

1. At the same DOS Command Prompt enter and run this command to verify the versions of all of the WSL containers:

    ```
    wsl -l -v
    ```

    !!! note
        Older versions of Windows may install/activate WSL 1 as part of the Docker install and Mathesar requires WSL 2.  If the results of this command show any WSL 1 containers, [follow the instructions here](https://learn.microsoft.com/en-us/windows/wsl/install#upgrade-version-from-wsl-1-to-wsl-2) to upgrade them to WSL 2.

1. Reboot the PC.

1. Locate the newly installed WSL/Ubuntu “app” on the Windows Start menu or by searching for “Ubuntu” using Windows Search. Double-click to run it.

1. In the WSL/Ubuntu window enter and run these commands to confirm that the Docker and Docker Compose versions are at least 23 and 2.10 as required for the Mathesar installation:

    ```
    docker --version
    ```

    ```
    docker compose version
    ```

1. Using the command prompt within the WSL/Ubuntu window, follow the [Mathesar installation steps](./index.md), pasting and running the "bash" command to begin installing Mathesar.
