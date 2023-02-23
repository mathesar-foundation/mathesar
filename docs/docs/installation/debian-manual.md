# Manual install on Debian 11

Installation should only take a few minutes.

## What we will do:
- Install Nginx webserver.    
- You need to be a user with root access to the machine you're trying to install Mathesar on.

## Preparing our server.
- Prerequisites
    - Debian 11
    - Root privileges
    
### Step one: Install Nginx
First, we need to update the software repository and upgrade all packages using the apt command below.  SSH to your server and elevate to the `root` user.
```sh
apt update && apt upgrade
```
Next we will install the required packages.
```sh
apt install locales build-essential acl ntp git python3-pip ipython3
```
Once installation has completed, we can install Nginx
```sh
apt install nginx
```

### Step two
Clean the system of any potential pre-installed Docker packages.
```sh
apt-get remove docker docker-engien docker.io
```
