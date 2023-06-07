# Guided installation script: under the hood

!!! info ""
    This document is related to the [Guided Installation method](./index.md).

## What does the script do?
Our guided installation script performs the following steps.

### Operating System Check
The installer attempts to determine what operating system you're installing Mathesar on. We've tested with some variants of macOS as well as a few distros of Linux. Some logic in the installer branches based on your operating system.

### Docker Version Check
The installer double-checks your Docker and Docker Compose versions, making sure that `docker` is at least version 20.0.0, and `docker-compose` is at least version 2.10.0.

### Database Configuration
Mathesar uses two PostgreSQL databases:

- **an internal database**, used to store Mathesar related metadata such as display options. This is set up on the same machine as Mathesar's deployment.
- **the user database**, which stores your data. You can either set up a new database from scratch for this purpose or connect an existing PostgreSQL database.

If you're setting a database up from scratch, the installer will set up credentials for both databases (a username and password), and also lets you customize the name of your user database. 

If you're connecting an existing database, you'll enter pre-existing credentials for the user database and set up new credentials for the Mathesar internal database.

The credentials created in this section are used to log in directly to the database (i.e., not the Mathesar UI). You'll set up login credentials for the UI in a later step.

Finally, Mathesar helps you customize the port exposed to your host machine from the database container. This is useful, since you'll need to have an exposed port to login to the Mathesar database(s) using an alternate client such as `psql`, but there could be a conflict on the default port (e.g. for the case that a PostgreSQL instance is running in the host OS).

### Webserver Configuration
This section lets you configure the entrypoint (Caddy) for every request you send to Mathesar. You may need to customize the ports if you have other services using ports on your machine. Additionally, you need to configure either a domain or an external IP address if you plan to expose your installation of Mathesar to the internet. Setting up the domain also gets HTTPS working properly on your Mathesar installation.

#### Domain Setup
The domain specified here should be a valid, registered domain, whose DNS entry points to the IP address of the server on which Mathesar is installed. DNS configuration should be done ahead of time.

If you don't use a domain, Mathesar can still be accessed from the internet using an IP address instead a domain name. Please note that HTTPS will not work without a domain name set up.

### Admin User Configuration

Here, the installer helps you create a user (separate from the database user) that you will use to login to Mathesar through the main web UI. This section walks you through that process to create a username and password for that user. You're allowed to use the same details as the database user above, but it's not required, or particularly recommended. The user created in this section will have admin privileges in Mathesar, and be able to create other users after the installation is complete.

### Configuration Directory

We need to store all the details configured above, and we do so in a file in your configuration directory. Note that this contains your passwords and other secrets, so **it should be kept secure**. By default, this directory is `/etc/mathesar/`, but you can change it.

We'll store two files under that directory:

- `.env`: This file has the above-mentioned configurations.
- `docker-compose.yml` This is a config file downloaded from Mathesar's git repo. It defines the different Docker containers used by Mathesar, and how they're networked together.

Recommended permissions for the `.env` file are:

`-rw------- 1 root root 449 Feb 22 13:39 /etc/mathesar/.env`

### Docker Setup

- The installer downloads the `docker-compose.yml` file from Mathesar's repo.
- The installer pulls all Docker images needed for Mathesar to run properly, and starts the various services in sequence.

### Final Steps

If everything has worked, then the installer prints a message letting you know that it's succeeded, and gives a little information about where you should go to login to Mathesar.

## Docker Containers Created
This installation process creates the following containers:

- `mathesar_service`, which runs the main Mathesar application.
- `mathesar_db`, which runs the database (PostgreSQL 13).
- `mathesar-caddy-reverse-proxy-1`, which helps route traffic to the `mathesar_service` container.
- `mathesar-watchtower-1`, which helps upgrade Mathesar installation when new releases are available.

## Files Involved
This installation process creates the following files in the Mathesar configuration directory:

- `.env`. This file defines the environment inside of the various Mathesar `docker` containers. It should be kept safe, since it has sensitive information about the passwords you set for Mathesar. If you've forgotten your admin username or password, look at this file.
- `docker-compose.yml`. This is the main file defining the Mathesar containers listed above, and the connections between them.
