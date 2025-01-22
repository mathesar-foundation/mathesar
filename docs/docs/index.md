# Mathesar Documentation

Mathesar is a self-hostable open source web application that provides a spreadsheet-like interface to PostgreSQL databases. Our web-based interface helps you and your collaborators set up data models, edit data, and build custom reports &mdash; no technical skills needed. You can create a new PostgreSQL database while setting up Mathesar or use our UI to interact with an existing database (or do both).

## Try Mathesar

This is a quick way to play with Mathesar locally, but is not appropriate for saving data that you care about or setting up a long-term installation.

1. With [Docker](https://docs.docker.com/get-docker/) installed, run:

    ```
    docker run -it --name mathesar -p 8000:8000 mathesar/mathesar:latest
    ```

1. Visit [http://localhost:8000/](http://localhost:8000/) to set up an admin user account and create a database connection.

    ??? tip "Tips when trying Mathesar locally"
        - To open a [psql](https://www.postgresql.org/docs/current/app-psql.html) shell within the container, run:
        
            ```
            docker exec -it mathesar sudo -u postgres psql
            ```

        - To stop Mathesar, press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the shell where it is running.

        - To start again, run `docker start mathesar`.

        - To remove the Docker container, run `docker rm mathesar` .

            ⚠️ This will also delete the data that you've saved within Mathesar!

## Install Mathesar

You can self-host Mathesar by following one of the guides below:

- [Install using Docker compose](./administration/install-via-docker-compose.md) — a production setup with separate reverse-proxy and database containers.
- [Install from scratch](./administration/install-from-scratch.md) — an advanced setup that doesn't rely on Docker.


## Help out

- [Make a donation](https://mathesar.org/donate) - We're a non-profit organization and your donations help sustain our core team. 
- [Help build Mathesar](https://github.com/mathesar-foundation/mathesar/blob/develop/CONTRIBUTING.md) - As an open source project, we actively encourage contribution!

