# Try Mathesar locally

You can use Mathesar's Docker image to test Mathesar on your own machine.  For a more complete self-hosted setup, use the [Docker Compose installation guide](./install-via-docker-compose.md).

## Start Mathesar

1. With [Docker](https://docs.docker.com/get-docker/) installed, run:

    ```
    docker run -it --name mathesar -p 8000:8000 mathesar/mathesar:latest
    ```

2. Visit [http://localhost:8000/](http://localhost:8000/) to set up an admin user account and create a database connection.

!!! danger "Not for production usage."
    This is a quick way to play with Mathesar locally. It is not appropriate for saving data that you care about or setting up a long-term installation.


## Useful local Docker commands

### Accessing the database

To open a [psql](https://www.postgresql.org/docs/current/app-psql.html) shell within the container, run:

```
docker exec -it mathesar sudo -u postgres psql
```

### Stopping and starting Mathesar

To stop Mathesar, press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the shell where it is running.

To start again, run:

```
docker start mathesar
```

### Removing the container

!!! warning ""
    Removing the container will also delete the data that you've saved within Mathesar.

To remove the Docker container, run:

```
docker rm mathesar
```