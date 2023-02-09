# Install using `docker compose`

## Prerequisites

- A working shell prompt (e.g., `bash`)
- Working installations of `docker` and `docker-compose` (see Docker's [installation docs](https://docs.docker.com/engine/install/))
- A user with permissions for running `docker` commands

## Installation Process

To install the newest version of Mathesar, cut-and-paste the below command into a terminal window and follow the instructions:
```sh
curl -sL https://raw.githubusercontent.com/centerofci/mathesar/master/install.sh | bash
```

## The Result

Running the script via the above command results in a `docker compose` setup with the following
- A container called `mathesar_service` running the main Mathesar webapp
- A container called `mathesar_db` with PostgreSQL 13 installed.
- A container called `mathesar-caddy-reverse-proxy-1` that helps route traffic to the `mathesar_service` container.

To access Mathesar, navigate to `localhost` in your web browser, and login using the user name and password you set during the installation.
