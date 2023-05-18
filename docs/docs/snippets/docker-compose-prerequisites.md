- You need **[Docker](https://docs.docker.com/desktop/) and [Docker Compose](https://docs.docker.com/compose/install/)**.

    We've tested with Docker v23 and Docker Compose v2.10. Older versions may not work.

- You need **root access**.

- If using a custom domain name

    Have your domain name ready during the installation process and have your DNS pointing to your Mathesar server.

- If connecting to an existing database

    - Ensure the external database can accept network connections from your Mathesar server.
    - Have the following information handy before installation:

        - Database hostname _(refer [Connect to existing Database server](/configuration/connect-to-existing-db) document to find instructions to connect to an existing database)_
        - Database port
        - Database name
        - Database username _(should exist and be a `SUPERUSER` [more info](https://www.postgresql.org/docs/13/sql-createrole.html))_
        - Database password

- If installing on Windows, you need to have [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) installed first and [Turn on wsl-2 in docker desktop](https://docs.docker.com/desktop/windows/wsl/#turn-on-docker-desktop-wsl-2)
