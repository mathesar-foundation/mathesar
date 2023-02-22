# Install on Ubuntu 20.04+ or Debian 11

Installation should only take a few minutes.

## What we will do:
- Prepare our server to run Docker and Docker Compose. Mathesar has been tested with Docker v23 and Docker Compose v2.10 (although v2.0 or higher should work). 
    - [Docker installation documentation](https://docs.docker.com/desktop/)
    - [`docker-compose` installation documentation](https://docs.docker.com/compose/install/)
- Run the install script to pull the required docker-compose.yaml file and start the installation.    
- You need to be a user with root access to the machine you're trying to install Mathesar on.

## Preparing our server.
- Prerequisites
    - Ubuntu 20.04
    - Root privileges
    - A domain name for your Mathesar installation, pointing to your server.  This is however not a necesity.

### Step one
First, we need to update the software repository and upgrade all packages using the apt command below.  SSH to your server and elevate to the `root` user.
```sh
apt update && apt upgrade
```
### Step two
Clean the system of any potential pre-installed Docker packages.
```sh
apt-get remove docker docker-engien docker.io
```
