### Operating System
You can install Mathesar using this method on Linux, MacOS, and Windows.

### Access
You should have **root access** to the machine you're installing Mathesar on.

### Software
You'll need to install the following software on the machine you're installing Mathesar on:

- **[Docker](https://docs.docker.com/desktop/)** v23+
- **[Docker Compose](https://docs.docker.com/compose/install/)** v2.10+
- **If you're installing on Windows:**
    - Ensure you have [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) installed
    - Turn on Docker Desktop WSL 2, [see Docker docs for more information](https://docs.docker.com/desktop/windows/wsl/#turn-on-docker-desktop-wsl-2)

### Domain
If you want Mathesar to be accessible over the internet, you'll probably want to set up a domain or sub-domain to use.

Before you start installation, **ensure that the DNS for your sub-domain or domain is pointing to the machine that you're installing Mathesar on**.

### Database
You can create a new PostgreSQL database while setting up Mathesar or use our UI to interact with an existing database. **If you're planning to set up a new database, you can skip this section.**

To connect Mathesar to an existing database:

- The external database should be able to accept network connections from your Mathesar server.
- You'll need to set up a database user for Mathesar to use. The user should be a `SUPERUSER`, [see PostgreSQL docs for more information](https://www.postgresql.org/docs/13/sql-createrole.html).
- Have the following information handy before installation:
    - Database hostname
    - Database port
    - Database name
    - Database username
    - Database password

See _[Connect to an existing database](/configuration/connect-to-existing-db)_ for more details.
