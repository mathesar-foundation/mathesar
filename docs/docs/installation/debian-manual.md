# Manual install on Debian 11

Installation should only take a few minutes.

## What we will do:
- Install Nginx webserver.
- Install     
- You need to be a user with root access to the machine you're trying to install Mathesar on.

## Preparing our server.
- Prerequisites
    - Debian 11 with at least `60 GB` disk space and `4GB` of RAM.
    - Root privileges
    
### Step one: Prepare the server
First, we need to update the software repository and upgrade all packages using the apt command below.  SSH to your server and elevate to the `root` user.
```sh
# apt update && apt upgrade
```
Next we will install the required packages.
```sh
# apt install locales build-essential acl ntp git python3-pip ipython3
```
Now we need to add a new usergroup and allow passwordless login:
```sh
# sudo groupadd deployers
# useradd deployer
# usermod -a -G deployers deployer
```
Now you need to edit the `/etc/sudoers` file with the 'visudo' command, and add this line:  `deployer ALL=(ALL) NOPASSWD: ALL` under the `# User privilege specification` section.


### Step two
Clean the system of any potential pre-installed Docker packages.
```sh
apt-get remove docker docker-engine docker.io
```
