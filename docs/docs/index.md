# Mathesar Documentation

## Welcome!

Mathesar is a self-hostable open source project that provides a spreadsheet-like interface to a PostgreSQL database. Our web-based interface helps you and your collaborators set up data models, edit data, and build custom reports &mdash; no technical skills needed. You can create a new PostgreSQL database while setting up Mathesar or use our UI to interact with an existing database (or do both).

## Try Mathesar

This is a quick way to play with Mathesar locally, but is not appropriate for saving data that you care about or setting up a long-term installation.

1. With [Docker](https://docs.docker.com/get-docker/) installed, run:

    ```
    docker run -it --name mathesar -p 8000:8000 mathesar/mathesar-prod:latest
    ```

2. Visit [http://localhost:8000/](http://localhost:8000/) to set up an admin user account and create a database connection.

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

- [Install using Docker compose](installation/docker-compose/index.md) — a production setup with separate reverse-proxy and database containers.
- [Install from scratch](installation/build-from-source/index.md) — an advanced setup that doesn't rely on Docker.

!!! info "More installation methods coming soon"
    We're working on supporting additional installation methods, and we'd appreciate feedback on which ones to prioritize. Please comment [on this issue](https://github.com/centerofci/mathesar/issues/2509) if you have thoughts.

## Use Mathesar

Mathesar should be pretty intuitive to use. More documentation is coming soon, but for now, we've written some documentation for some things that could be tricky.

- [Syncing database changes](./user-guide/syncing-db.md) if the database's structure is changed outside of Mathesar.
- How to set up [users with different access levels](./user-guide/users.md)

## Contribute to Mathesar

As an open source project, we actively encourage contribution! Get started by reading our [Contributor Guide](https://github.com/centerofci/mathesar/blob/develop/CONTRIBUTING.md).

## Donate

We're a non-profit and your donations help sustain our core team. You can donate via [GitHub](https://github.com/sponsors/centerofci) or [Open Collective](https://opencollective.com/mathesar).
