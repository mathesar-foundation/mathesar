# Developer Guide

## Stack

Mathesar is built using:

- [PostgreSQL](https://www.postgresql.org/) for the data storage
- [Python](https://www.python.org/) for the backend
- [Django](https://www.djangoproject.com/) for the web application
- [SQLAlchemy](https://www.sqlalchemy.org/) to talk to the database
- [Django REST Framework](https://www.django-rest-framework.org/) for the API 
- [Svelte](https://svelte.dev/) and [TypeScript](https://www.typescriptlang.org/) for the frontend

## Local development setup

> **Note:** If you are developing on Windows, first install [WSL](https://learn.microsoft.com/en-us/windows/wsl/install). Then do all of your development work from within the WSL shell, including running commands like `git clone` and `docker compose`.

1. Ensure ensure that you have [Docker](https://docs.docker.com/get-docker/) installed.

1. Clone the repository and `cd` into it.

1. Copy the `.env.example` file to `.env` like so:

    ```
    cp .env.example .env
    ```

1. From the repository's root directory, run:

    ```
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up dev-service
    ```

    > **Note:** You may need to run docker `sudo` depending on how you have it installed.

    You should now have a web server and database server running.

1. Login at http://localhost:8000/ with the following credentials:

    - username: `admin`
    - password: `password`

1. Keep Docker running while making your code changes. The app will update automatically with your new code.

## Contribution guidelines

Before getting started with your code changes, read our [Contributor guide](./CONTRIBUTING.md) to understand our processes for handling issues and and PRs.

## Loading sample data

For sample table data, you can create a new table in the UI using the `patents.csv` file found in `/mathesar/tests/data`.

<!-- TODO add more content about sample data -->

## API

See our [API guide](./mathesar/api/README.md) for more information on API usage and development.

## Back end development

- The `db` directory contains low-level code for interacting with the database.
- The `mathesar` directory contains the Django application and API, which we sometimes refer to as the "service layer".

### Running backend tests

We use [pytest](https://docs.pytest.org) for our backend tests.

- Run all backend tests:

    ```
    docker exec mathesar_service_dev pytest mathesar/ db/
    ```

- Run a specific test, by name:

    ```
    docker exec mathesar_service_dev pytest -k "test_name"
    ```

- See the [pytest documentation](https://docs.pytest.org/en/latest/how-to/usage.html), or run pytest with the `--help` flag to lear about more options for running tests.

## Front end development

- All the front end code is in the `mathesar_ui` directory.
- If you are modifying front end code, read more the [Front end development](./mathesar_ui/README.md) guide.

## Full-stack linting

To lint the front end and back end code at the same time, run the `lint.sh` script from the root of the repository. The script requires that the Python virtual environment with `flake8` be activated and that Node modules be installed in `mathesar_ui/`. Alternatively, ESLint and Flake8 should be installed globally on the system.

```
./lint.sh
```

- By default, the script lints both Python and Node.js (if changes are staged), but this can be overridden with the `-p` and `-n` flags respectively.

    ```
    ./lint.sh -p false
    ```

- You may wish to symlink the script as a pre-commit hook to lint your changes before committing.

    ```
    ln -s ../../lint.sh .git/hooks/pre-commit
    ```

## Usage with preexisting databases

If you want to use Mathesar with a preexisting Postgres DB, modify the `DATABASES.mathesar_tables` entry of the `config/settings.py` file with appropriate connection details before installing the Mathesar types and functions by running `install.py` as described in the previous step.

## Rebuilding the Docker images

Sometimes you may need to rebuild your Docker images after pulling new code changes or switching branches. Do so via:

```
docker compose -f docker-compose.yml -f docker-compose.dev.yml up dev-service --force-recreate --build dev-service
```


## Demo mode

Mathesar can be run in "demo mode" to meet the specific needs of our [live demo site](https://demo.mathesar.org).

See our [Live demo mode](./demo/README.md) guide for more information on enabling live demo mode locally


## Opening a shell in the container

- If you need to do some work within the container you can open a bash shell via:

    ```
    docker exec -it mathesar_service_dev bash
    ```

- To open a PostgreSQL [psql](https://www.postgresql.org/docs/current/app-psql.html) terminal for the data in Mathesar:

    ```
    docker exec -it mathesar_db psql -U mathesar
    ```

## Troubleshooting

### Permissions within Windows

- Running Script in powershell is disabled by default in windows , you have to change permission to run scripts  [Official Docs ](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-7.2) 

### Fixing line endings on Windows

If you happen to clone the git repository outside of WSL, then you fix it by running these commands from within WSL.

```
git config --global core.autocrlf input
sudo apt-get install -y dos2unix
sudo find . -type f -exec dos2unix {} \;
```

These commands install the `dos2unix` utility, which converts text files from the DOS/Microsoft Windows format (with CRLF line endings) to the Unix/Linux format (with LF line endings). Next, the find utility is used to locate all files (-type f) in the current directory (.) and its subdirectories, and the dos2unix command is then executed on each of them (-exec dos2unix ;).


### Live reloading front end code on Windows

Hot module replacement for front end code does not work when the project is present on a windows filesystem and WSL is used to run docker. [Read more](./mathesar_ui/README.md#live-reloading-on-windows).

### PostgreSQL server is running on your host machine

If you you see the following error after attempting to start Docker, then the port used by Postgres is already in use on your host machine.

> ERROR: for db Cannot start server db: driver failed programming external connectivity on endpoint mathesar_db (70c521f468cf2bd54014f089f0051ba28e2514667): Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use.

1. First stop Postgres on your host machine.

    ```
    sudo service postgresql stop
    ```

1. Then try starting Mathesar via Docker again.

Note that you'll need to manually start your Postgres server on your host machine again if you want to continue working on other projects which rely on that. And the next time you restart your machine, you'll probably need to stop Postgres again before you can begin working on Mathesar.

### Invalid function definition SQL errors

Upon starting Mathesar, you may notice errors similar to:
```
mathesar_service_dev  | psycopg.errors.InvalidFunctionDefinition: cannot change name of input parameter "tab_id"
mathesar_service_dev  | HINT:  Use DROP FUNCTION msar.drop_table(oid,boolean,boolean) first.
```
In this case, it's probable that a function parameter name was changed in the `develop` branch at some point. To fix this, you must drop the `msar` and `__msar` schemas from the PostgreSQL database you're using for development using either `psql` or a different client. After doing this, simply stop and start Mathesar using the appropriate `docker compose` commands.
