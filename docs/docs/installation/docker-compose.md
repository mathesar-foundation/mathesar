# Install using `docker compose`

## Prerequisites

- A working, POSIX-compliant shell (e.g., a `bash` prompt).
- `bash` installed on your machine.
- Working installations of relatively recent versions of `docker` and `docker-compose` (see Docker's [installation docs](https://docs.docker.com/engine/install/))
- A user in the `sudoers` file (one that can run commands with `sudo`).

## Installation Process

To install the newest version of Mathesar, cut-and-paste the below command into a terminal window and follow the instructions:
```sh
bash <(curl -sL https://raw.githubusercontent.com/centerofci/mathesar/master/install.sh)
```

## The Result

Running the script via the above command results in a `docker compose` setup with the following

- A container called `mathesar_service` running the main Mathesar webapp
- A container called `mathesar_db` with PostgreSQL 13 installed.
- A container called `mathesar-caddy-reverse-proxy-1` that helps route traffic to the `mathesar_service` container.

To access Mathesar, navigate to `localhost` in your web browser, and login using the admin user name and password you set during the installation.

## Troubleshooting

### Docker versions

The most common problem we've encountered is users with out-of-date `docker` or `docker-compose` versions.

- To determine your `docker-compose` version, run `docker compose version`. (Note the lack of hyphen.) You need `docker-compose` version 2.0 or higher for the installation to succeed. Better if it's version 2.10 or higher.
- To determine your `docker` version, run `docker --version`. We've tested with `docker` version 23, but lower versions may work.

If you run `docker-compose --version` and see a relatively old version, try `docker compose version` and see whether it's different. The latter is the version that will be used in the script.

### Ports

You may see errors about various ports being unavailable (or already being bound). In this case, please restart from a clean `docker` state, and choose non-default ports during the installation process for PostgreSQL, http traffic, or https traffic as appropriate.

### Permissions

If you have permissions issues when the script begins running `docker` commands, please double-check that your user is in the `sudoers` file. Try running `sudo -v`. If that gives an error, your user lacks needed permissions and you should speak with the administrator of your system.

## Getting more help

If you're having an issue not covered by this documentation, please chat with us [on Matrix](https://matrix.to/#/#mathesar:matrix.mathesar.org).
