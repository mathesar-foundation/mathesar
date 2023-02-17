# Install with Docker Compose

Installation should only take a few minutes.

## Requirements
- You'll need to install or upgrade Docker and `docker compose` on your computer. Mathesar has been tested with Docker v23 and Docker Compose v2.10 (although v2.0 or higher should work).
    - [Docker installation documentation](https://docs.docker.com/desktop/)
    - [`docker-compose` installation documentation](https://docs.docker.com/compose/install/)
- You need to be a user with root access to the machine you're trying to install Mathesar on.

## Quickstart
To install the newest version of Mathesar, cut-and-paste the below command into a terminal window and follow the instructions:

```sh
bash <(curl -sL https://raw.githubusercontent.com/centerofci/mathesar/master/install.sh)
```

To access Mathesar, navigate to `localhost` in your web browser, and login using the admin user name and password you set during the installation.

## Administration

### Starting and stopping Mathesar

The command to stop all containers used for Mathesar, and release their ports, etc. is:
```sh
sudo docker compose -f ~/.config/mathesar/docker-compose.yml --profile prod down
```

The command to start Mathesar (say, after stopping it, or a reboot of the machine) is:
```sh
sudo docker compose -f ~/.config/mathesar/docker-compose.yml --profile prod up
```

### Upgrading Mathesar
The command to manually upgrade Mathesar to the newest version is:

```sh
sudo docker exec mathesar-watchtower-1 /watchtower --run-once
```

## Under the Hood

### Installation steps
These are the steps that the installation script performs, explained in more depth:

1. First, we create a directory on your system where we store Mathesar-related configuration. This contains your passwords and other secrets, so **it should be stored in a secure location**. By default, this is `~/.config/mathesar/`, but you can change it.
1. Next, we download the main `docker-compose.yml` config file from Mathesar's git repo. This file defines the different Docker containers used by Mathesar, and how they're networked together. This file will live in the directory from Step 1.
1. In order to keep Mathesar's web server secure, we then randomly generate a secret key. It's not necessary for you to know this secret key, since it's just for internal Mathesar use.
1. In the next step, the installation script prompts you to create credentials for use in the Mathesar internal system database. This database is used for metadata such as table display options, user information, and so on. It's different from the database where your actual data is stored. The credentials created here are also used if one wants to log directly into the PostgreSQL database underlying Mathesar using `psql` or some other client.
1. Next, the installer prompts you to choose an alternate port to expose for the PostgreSQL database, if needed. The reason to allow customizing this is that some users may already have PostgreSQL running on their host machine, and in this case Mathesar would need to use a non-default port for PostgreSQL traffic.
1. In the next step, we configure a domain where the installation of Mathesar will be available on the internet (if desired). This is used to get `https` working properly.
1. Next, the installation script prompts you to create another set of credentials. These credentials are the admin user for the actual Mathesar UI. 
This user will be able to create other, less-privileged users after the installation is complete. You'll use these credentials to login to Mathesar in the web interface for the first time. This username and password could be different from the system database user you created above, or you can use the same details.
1. In the next step, you can configure a custom name for your new Mathesar database. This will let you identify which database is associated with Mathesar if you login to PostgreSQL using a different client (such as psql). N.B. This is different from the database you configured above, but uses the same username and password.
1. The next step lets you configure which ports are exposed for http and https traffic, respectively. You may need to customize these ports if you're running multiple web services on the same server.
1. Then, the installation script consolidates all of the information entered in previous steps into variables that are stored in a file called `.env` in the directory chosen in the first step.
1. Because the final few steps involve running Docker commands, the installer needs to prompt you for your password so it can run `sudo`. Note that this means these steps will fail if your user is not in the `sudoers` file.
1. The installer pulls all Docker images needed for Mathesar to run properly, and starts the various services in sequence.
1. If everything has worked, then the installer prints a message letting you know that it's succeeded, and gives a little information about where you should go to login to Mathesar.

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
