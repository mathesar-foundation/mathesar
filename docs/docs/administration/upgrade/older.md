# Upgrading Mathesar to older versions

## For installations using Docker Compose {:#docker-compose}

If you have a Docker compose installation (including one from the guided script), run the command below:

```
docker compose -f /etc/mathesar/docker-compose.yml up --pull always -d
```

!!! note "Your installation directory may be different"
    You may need to change `/etc/mathesar/` in the command above if you chose to install Mathesar to a different directory.

## For installations done from scratch {:#scratch}

If you installed from scratch, the upgrade instructions are the same as [for 0.1.4](../upgrade/0.1.4.md#scratch), but you do not need to change the environment variables.
