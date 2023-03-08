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

- During installation, choose "WSL 2" instead of "Hyper-V". WSL is the Windows Sub System for Linux and is required to run Mathesar.
- See [this tutorial](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers) for hints if you're having trouble getting Docker wired up properly.
- Make sure you're use the WSL command prompt (rather than DOS or PowerShell) when running the installation script and other commands.
