# Quickstart

Installation should only take a few minutes.

!!! info
    We've tested this installation procedure on Windows, Mac, and a few Linux variants, but this is our first release so there might be unexpected issues. Please open a [GitHub issue](https://github.com/centerofci/mathesar/issues) if you run into any problems.

## Requirements
- You'll need a machine to install Mathesar on. You should have root access to the machine.
- You'll need to install or upgrade Docker and `docker compose` on your computer. Mathesar has been tested with Docker v23 and Docker Compose v2.10 (although v2.0 or higher should work).
    - [Docker installation documentation](https://docs.docker.com/desktop/)
    - [`docker-compose` installation documentation](https://docs.docker.com/compose/install/)

##### Domain name
**If you're setting up Mathesar with a domain name**, you'll need to update the DNS to point at the machine that Mathesar is being installed on. Please have the domain name on hand before the installation process.

##### Connecting Mathesar to an existing database
**If you're setting up Mathesar to connect to an existing database**, you'll need the following information handy before installation:

- Database hostname (cannot be `localhost`, we'll add support for this in a future release)
- Database port
- Database name
- Database username (the user should exist and be a `SUPERUSER`. See [the PostgreSQL docs](https://www.postgresql.org/docs/13/sql-createrole.html) for more info.)
- Database password

!!! warning
    Please make sure the external database is set up to accept network connections from the machine you're installing Mathesar on.

## Installation
To install the newest version of Mathesar, cut-and-paste the below command into a terminal and follow the instructions:

```sh
bash <(curl -sL https://raw.githubusercontent.com/centerofci/mathesar/master/install.sh)
```

You'll set up the domain you'll access Mathesar using and an admin username and password during installation. To access Mathesar, navigate to the domain and login using the admin user name and password.
