# Local development setup

## Setup

First, [ensure that you have Docker installed](https://docs.docker.com/get-docker/).

Clone the repository and then copy the `.env.example` file to `.env` like so:
```
cp .env.example .env
```

From the repository's root directory, run:
```
docker-compose --profile dev up
```

You should now have a web server and database server running. Opening `http://localhost:8000` in your browser will open the application. 

To get the UI working, you need to login at

`http://localhost:8000/auth/login/`

with username:

`admin` 

and password:

`password` 

If you'd prefer to develop using the Django Rest Framework browsable API, you can use the login functionality at the top right with the same username and password. If you prefer a non-browser tool for API development, you'll have to:
- Use browser to execute one of the methods above, then
- Extract the key, value pair for the cookie named `sessionid` using dev tools.
- submit that cookie with each request until it expires.
- Repeat as necessary (e.g., when the cookie expires).

For sample table data, you can create a new table in the UI using the `patents.csv` file found in `/mathesar/tests/data`. 

It is recommended that you keep the Docker containers running while you make changes to the code. Any change to the code made locally will sync to the container and the version deployed at `http://localhost:8000` will always be the latest local version of the code.

## Developing in Windows

Windows users who want to run the Mathesar Docker development environment in WSL are advised to clone the repository in a Linux filesystem. When the project resides in a Windows filesystem, WSL does not work well with hot module replacement (HMR), which is required for frontend development. Please refer to our [Common Issues wiki page](https://wiki.mathesar.org/engineering/common-issues), and the [frontend development README file](https://github.com/centerofci/mathesar/blob/master/mathesar_ui/README.md#developing-in-windows) for more details.

## Configuration Options

If you want to use Mathesar with a preexisting Postgres DB, modify the `DATABASES.mathesar_tables` entry of the `config/settings.py` file with appropriate connection details before installing the Mathesar types and functions by running `install.py` as described in the previous step. 

## Frontend

For more detailed information on Mathesar's frontend development, see [the README in the `mathesar_ui` folder](https://github.com/centerofci/mathesar/blob/master/mathesar_ui/README.md).

## Documentation

For more detailed information on working on Mathesar's documentation, see [the README in the `docs` folder](https://github.com/centerofci/mathesar/blob/master/docs/README.md).

## Demo mode

Mathesar can be run in "live demo mode". This creates a new database for every user session, adds a banner to the UI, and enables analytics, sent to the Mathesar team.

To run Mathesar in demo mode, you should add an environment variable to `.env`:

``` sh
DJANGO_SETTINGS_MODULE=demo.settings
```

## Linting

To lint the project, run the `lint.sh` script from the root of the repository. The script requires that the Python virtual environment with `flake8` be activated and that Node modules be installed in `mathesar_ui/`. Alternatively, ESLint and Flake8 should be installed globally on the system.
```
./lint.sh
```

By default, the script lints both Python and Node.js (if changes are staged), but this can be overridden with the `-p` and `-n` flags respectively.
```
./lint.sh -p false
```

You should symlink the script as your pre-commit hook to ensure that your code is linted along-side development.
```
ln -s ../../lint.sh .git/hooks/pre-commit
```

## Running tests

If you'd like to run tests before pushing, here's how you do it:

Backend tests:
```
docker exec mathesar_service pytest mathesar/ db/
```

Frontend tests:
```
docker exec mathesar_service bash -c "cd mathesar_ui && npm test"
```

## Opening a shell in the container

If you need to do some work on the container that's running the code, here's how you access it:
```
docker exec -it mathesar_service bash
```

To open a PostgreSQL psql terminal for the data in Mathesar:
```
docker exec -it mathesar_db psql -U mathesar
```

## Troubleshooting
Please refer to our [Common Issues wiki page](https://wiki.mathesar.org/engineering/common-issues) for instruction on troubleshooting common issues while setting up and running Mathesar.
