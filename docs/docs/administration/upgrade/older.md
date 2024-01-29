# Upgrading Mathesar to older versions

- If you installed from source, the instructions are the same as [above](#upgrade-source), but you need not change the environment variables.
- If you have a Docker compose installation (including one from the guided script), follow the instructions [above](#upgrade-dc) to find the location of your `docker-compose.yml`, copy it into the box as instructed, and then run the command below (which should now be appropriately customized):
```
docker compose -f xMATHESAR_INSTALLATION_DIRx/docker-compose.yml up --force-recreate --build service
```