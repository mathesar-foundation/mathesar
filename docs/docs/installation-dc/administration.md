# Administration

## Starting and stopping Mathesar

The command to start Mathesar (say, after stopping it, or a reboot of the machine) is:
```sh
sudo docker compose -f /etc/mathesar/docker-compose.yml --profile prod up -d
```

The command to stop all containers used for Mathesar, and release their ports, etc. is:
```sh
sudo docker compose -f /etc/mathesar/docker-compose.yml --profile prod down
```

If you changed the Mathesar configuration directory during installation, you'll need to change `/etc/mathesar` in the commands above to your configuration directory.

## Upgrading Mathesar
The command to manually upgrade Mathesar to the newest version is:

```sh
sudo docker exec mathesar-watchtower-1 /watchtower --run-once
```
