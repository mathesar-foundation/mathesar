
# Manual install on Debian 11

Installation should only take a few minutes.

## What we will do:
- Prepare the server

- ###### Database
  - Install PostgreSQL
  - Create Database, Database user
  - Create .env file for Django
- ###### Web Server
  - Install Nginx webserver 
  - Install Letsencrypt and Gurnicorn3  
- ##### Install Mathesar
  - Set up NodeJS
  - Set up Gunicorn 
- You need to be a user with root access to the machine you're trying to install Mathesar on. 
## Preparing our server.
- Prerequisites
    - Debian 11 with at least `60 GB` disk space and `4GB` of RAM.
    - Root privileges
    - Domain name, or subdomain, for your installation.  We will use `mathesar.example.com` as the domain for our website. 
`IMPORTANT! Pay close attention to all commands / blocks of code as your FQDN/URL will be used in quite a few places.  It is important you change it everywhere.`
    - Python 3.9 (We will install this.) 
    
### Step one: Prepare the server
First, we need to update the software repository and upgrade all packages using the apt command below.  SSH to your server and elevate to the `root` user.
```sh
apt update && apt upgrade
```
Once the system has been updated, I recommend you perform a reboot to get the new kernel running incase it was updated.
Next we will install the required packages.
```sh
apt install locales build-essential acl ntp git python3-pip ipython3 zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev -y
```
Now we need to add a new usergroup and allow passwordless login:
```sh
sudo groupadd deployers
useradd deployer
usermod -a -G deployers deployer
```
Now you need to edit the `/etc/sudoers` file with the 'visudo' command, and add this line:  `deployer ALL=(ALL) NOPASSWD: ALL` under the `# User privilege specification` section.  If it fails to save, then edit again and move that to the last line of the file.  Remember to use TAB between the username and the first `ALL` section
You can test it with the following command:
```sh 
visudo -c
```
The output should look like this: `/etc/sudoers: parsed OK`. 

##### Install Python 3.9

We already installed the required dependencies in the previous step, so in the next step, we will download the Official Python 3.9 setup file using the “wget” command:

```sh
 wget https://www.python.org/ftp/python/3.9.7/Python-3.9.7.tgz
 ```
 Now we will unpack it, then change to the folder and run the configure script:
 ```sh
 tar -xvf Python-3.9.7.tgz
 cd Python-3.9.7/
 ./configure --enable-optimizations
 ```
 Next, utilize the “make” command to compile and build the configurations:
 ```sh
 make
 ```
 Finally, use the below-provided command to install Python 3 binaries on the Ubuntu 22.04 system:
 ```sh
 sudo make altinstall
 ```
 Confirm the Python successful installation by checking its version:
```sh
python3.9 --version
```
##### Switch python version
Now that we have multiple Python versions installed, we need to add the symbolic links for every Python version separately.  This will allow us to switch versions as needed on our system.  Run the following commands:
```sh
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1
sudo update-alternatives --install /usr/bin/python python /usr/local/bin/python3.9 2
```
This will create the necessary links.  You can now select which version of Python you want to use with the following command.  (You will select 2 here as we want Python 3.9)
```sh
sudo update-alternatives --config python
```
