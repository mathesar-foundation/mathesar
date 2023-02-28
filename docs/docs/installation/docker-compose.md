# Install with Docker Compose

Installation should only take a few minutes.

## Requirements
- You'll need to install or upgrade Docker and `docker compose` on your computer. Mathesar has been tested with Docker v23 and Docker Compose v2.10 (although v2.0 or higher should work).
    - [Docker installation documentation](https://docs.docker.com/desktop/)
    - [`docker-compose` installation documentation](https://docs.docker.com/compose/install/)
- You need to be a user with root access to the machine you're trying to install Mathesar on.

## Quickstart
To install the newest version of Mathesar, cut-and-paste the below command into a terminal and follow the instructions:

```sh
bash <(curl -sL https://raw.githubusercontent.com/centerofci/mathesar/master/install.sh)
```

You'll set up the domain you'll access Mathesar using and an admin username and password during installation. To access Mathesar, navigate to the domain and login using the admin user name and password.

## Administration

For the commands below, you need to replace `$MATHESAR_CONFIG_DIR` with the actual value you set during the installation process. By default, this should be `/etc/mathesar`.

### Starting and stopping Mathesar

The command to start Mathesar (say, after stopping it, or a reboot of the machine) is:
```sh
sudo docker compose -f /etc/mathesar/docker-compose.yml --profile prod up -d
```

The command to stop all containers used for Mathesar, and release their ports, etc. is:
```sh
sudo docker compose -f /etc/mathesar/docker-compose.yml --profile prod down
```

If you changed the Mathesar configuration directory during installation, you'll need to change `/etc/mathesar` in the comamnds above to your configuration directory.

### Upgrading Mathesar
The command to manually upgrade Mathesar to the newest version is:

```sh
sudo docker exec mathesar-watchtower-1 /watchtower --run-once
```

## Under the Hood

### Installation Steps
These are the steps that the installation script performs, explained in more depth:

#### Docker Version Check

The installer double-checks your Docker and Docker Compose versions, making sure that `docker` is at least version 20.0.0, and `docker-compose` is at least version 2.0.0.

#### Database Configuration
   
Mathesar actually uses two databases; one internal system database for metadata such as table display options, and a separate user database for your actual table data. The installer helps you set up credentials for both databases (a username and password), and also lets you customize the name of your user database. Finally, Mathesar helps you customize the port exposed to your host machine from the database container. This is useful, since you'll need to have an exposed port to login to the Mathesar database(s) using an alternate client such as `psql`, but there could be a conflict on the default port. 

The credentials created in this section are used to login directly to the database (i.e., not through the Mathesar UI).

**Note on permissions**: If you choose to connect Mathesar to a preexisting PostgreSQL database, you need to make sure that the user you choose:
- exists
- Is a `SUPERUSER`. See [the PostgreSQL docs](https://www.postgresql.org/docs/13/sql-createrole.html) for info about that.

**Limitation**: Mathesar cannot currently connect to a PostgreSQL database running on `localhost` on the host machine underlying your Docker setup. We're working on adding this functionality.
#### Webserver Configuration

This section lets you customize the details of the webserver that provides the Mathesar web UI, and API endpoints. Most of the customizations available here are only relevant if you're planning to expose your installation of Mathesar to the wider internet. You can configure the domain as well as the ports to use for http and https traffic, respectively.
   
#### Admin User Configuration

Here, the installer helps you create a user (separate from the database user) that you will use to login to Mathesar through the main web UI. This section walks you through that process to create a username and password for that user. You're allowed to use the same details as the database user above, but it's not required, or particularly recommended. The user created in this section will have admin privileges in Mathesar, and be able to create other users after the installation is complete.

#### Configuration Directory

We need to store all the details configured above, and we do so in a file in your configuration directory. Note that this contains your passwords and other secrets, so **it should be kept secure**. By default, this directory is `/etc/mathesar/`, but you can change it.

We'll store two files under that directory:

- `.env`: This file has the above-mentioned configurations.
- `docker-compose.yml` This is a config file downloaded from Mathesar's git repo. It defines the different Docker containers used by Mathesar, and how they're networked together.

#### Docker Setup

- The installer downloads the `docker-compose.yml` file from Mathesar's repo.
- The installer pulls all Docker images needed for Mathesar to run properly, and starts the various services in sequence.

#### Final Steps

If everything has worked, then the installer prints a message letting you know that it's succeeded, and gives a little information about where you should go to login to Mathesar.

### Docker containers
This installation process creates the following containers:

- `mathesar_service`, which runs the main Mathesar application.
- `mathesar_db`, which which runs the database (PostgreSQL 13).
- `mathesar-caddy-reverse-proxy-1`, which helps route traffic to the `mathesar_service` container.
- `mathesar-watchtower-1`, which helps upgrade Mathesar installation when new releases are available.

### Files
This installation process creates the following files in the Mathesar configuration directory:

- `.env`. This file defines the environment inside of the various Mathesar `docker` containers. It should be kept safe, since it has sensitive information about the passwords you set for Mathesar. If you've forgotten your admin username or password, look at this file.
- `docker-compose.yml`. This is the main file defining the Mathesar containers listed above, and the connections between them.

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

If you're having an issue not covered by this documentation, please open an issue [on GitHub](https://github.com/centerofci/mathesar/issues).
