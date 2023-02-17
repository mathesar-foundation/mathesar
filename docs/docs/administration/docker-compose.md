# Manage Mathesar using `docker compose` 

## Prerequisites

This page describes basic management of the setup installed by following the instructions on [this page](../installation/docker-compose.md).

## Location of files

Mathesar keeps a couple of files under `~/.config/mathesar/` that are used for managing your setup. 

### Stopping Mathesar

The command to stop all containers used for Mathesar, and release their ports, etc. is:
```sh
sudo docker compose -f ~/.config/mathesar/docker-compose.yml --profile prod down
```

The command to start Mathesar (say, after stopping it, or a reboot of the machine) is:
```sh
sudo docker compose -f ~/.config/mathesar/docker-compose.yml --profile prod up
```

The commands to manually update the Mathesar service (i.e., to get any new features the Mathesar team has developed since you installed) are:

```sh
sudo docker exec mathesar-watchtower-1 /watchtower --run-once
```
