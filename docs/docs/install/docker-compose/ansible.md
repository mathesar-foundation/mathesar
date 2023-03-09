# Setup Ansible for Docker Compose installations

If you're installing Mathesar on a Linux server, here are some Ansible tasks for setting up the pre-requisites, written by one of our testers.

After running these, you'll want to SSH into the server and [run the interactive installer](./index.md). This will start a script that will download Mathesar and setup the required Docker containers as described in the prior pages. The installation script is interactive, so it cannot run using Ansible yet.

## Ubuntu

```yaml
---
- name: Install Docker CE and Docker Compose on Ubuntu 20.04
  hosts: all
  become: true
  vars:
    docker_apt_key: https://download.docker.com/linux/ubuntu/gpg
    docker_apt_repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_lsb.codename }} stable"
    docker_compose_version: "1.29.2"

  tasks:
  - name: Install required packages
    apt:
      name: 
        - apt-transport-https
        - ca-certificates
        - curl
        - gnupg-agent
        - software-properties-common
      state: present

  - name: Add Docker repository key
    apt_key:
      url: "{{ docker_apt_key }}"

  - name: Add Docker CE repository
    apt_repository:
      repo: "{{ docker_apt_repo }}"
      state: present

  - name: Install Docker CE
    apt:
      name: docker-ce
      state: present

  - name: Install Docker Compose
    shell: curl -L "https://github.com/docker/compose/releases/download/{{ docker_compose_version }}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose

  - name: Start Docker Service
    service:
      name: docker
      state: started
      enabled: yes
```

## CentOS

```yaml
---
- name: Install Docker CE and Docker Compose on CentOS 7.1
  hosts: all
  become: true
  gather_facts: no
  vars:
    docker_apt_key: https://download.docker.com/linux/centos/gpg
    docker_apt_repo: "https://download.docker.com/linux/centos/docker-ce.repo"
    docker_compose_version: "1.29.2"

  tasks:
  - name: Install required packages
    yum:
      name: 
        - yum-utils
        - device-mapper-persistent-data
        - lvm2
      state: present

  - name: Add Docker repository key
    rpm_key:
      key: "{{ docker_apt_key }}"

  - name: Add Docker CE repository
    yum_repository:
      name: docker-ce
      baseurl: "{{ docker_apt_repo }}"
      enabled: 1
      gpgcheck: 1
      gpgkey: "{{ docker_apt_key }}"

  - name: Install Docker CE
    yum:
      name: docker-ce
      state: present

  - name: Install Docker Compose
    shell: curl -L "https://github.com/docker/compose/releases/download/{{ docker_compose_version }}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose

  - name: Start Docker Service
    service:
      name: docker
      state: started
      enabled: yes
```

