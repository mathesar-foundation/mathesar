# Manual install on Debian 11

Installation should only take a few minutes.

## What we will do:
- Prepare the server
- Install Docker & Docker-compose
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
Now that we are sure there is no pre-configured or installed Docker on the system, we can begin the installation.
Firstly, we have to install the required Docker dependencies on the system:
```sh
sudo apt -y install apt-transport-https ca-certificates curl gnupg2 software-properties-common
```
The next step is to add Docker's official GPG key to the keyring.  This is to ensure the validity of downloaded Docker packages from it's repository.
```sh
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```
Now that the key is added, we can add the stable repo for Docker. 
```sh
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
```
We have to update the system:
```sh
apt update
```
We can now install Docker using the following command:
```sh
apt-get install docker-ce docker-ce-cli containerd.io
```
Once installation is completed, you can run the following commands to make sure that Docker is running, and that it will start with the system.
```sh
systemctl enable docker && systemctl start docker
```

##### Install Docker-compose
We will install Docker-compose next.  We will start by downloading the latest Docker-compose version.
```sh
sudo curl -L "https://github.com/docker/compose/releases/download/2.16.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```
Once downloaded, we have to change the properties so that it is an executable:

```sh
sudo chmod +x /usr/local/bin/docker-compose
```
That is it.  
