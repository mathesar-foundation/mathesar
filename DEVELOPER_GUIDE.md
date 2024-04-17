# Developer Guide

This guide explains how to work with Mathesar's code. Be sure to also see our [Contributor Guide](./CONTRIBUTING.md) to learn about our collaboration workflow.

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

1. Ensure that you have [Docker](https://docs.docker.com/get-docker/) installed.

1. Clone the repository and `cd` into it.

1. Copy the .env file by running the following command in the repository's root directory:
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

1. Keep Docker running while making your code changes. The app will update automatically with your new code. Please refer to our [Troubleshooting guide](#troubleshooting) if you are experiencing any issues.

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

- Run all python backend tests:

    ```
    docker exec mathesar_service_dev pytest mathesar/ db/
    ```

- Run a specific python test, by name:

    ```
    docker exec mathesar_service_dev pytest -k "test_name"
    ```
    
- See the [pytest documentation](https://docs.pytest.org/en/latest/how-to/usage.html), or run pytest with the `--help` flag to learn about more options for running tests.

- Run all SQL tests:

    ```
    docker exec mathesar_dev_db /bin/bash sql/run_tests.sh
    ```

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

## Internationalization

Our repo contains two separate i18n flows: one for the server-rendered UI from **Django**, and another for the client-rendered UI handled by **Svelte**.

### Django i18n

We use the i18n features provided by Django. Refer the [Django docs](https://docs.djangoproject.com/en/4.2/topics/i18n/translation/#internationalization-in-template-code) on how to translate strings.

#### When modifying UI strings

If you make code changes to the UI strings in Django templates, follow these steps to ensure your changes are properly translated.

1. Regenerate the English-language [django.po](./translations/en/LC_MESSAGES/django.po) file:

    ```
    docker exec mathesar_service_dev python manage.py makemessages -l en -i "mathesar_ui" -i "docs"
    ```

    > **Note:**
    >
    > Only generate the `.po` file for _English_. Do not update other languages using `makemessages`. They will be pulled from our translation service provider when the translation process is complete.

1. Commit the changes to `django.po` along with your code changes.

#### When preparing a release

Django uses gettext, which require the `.po` files to be compiled into a more efficient form before using in production.

1. Compile the Django messages:

    ```
    docker exec mathesar_service_dev python manage.py compilemessages
    ```

    This will produce files with `.mo` extension for each of the `.po` files.

1. Test the app locally with different languages.

### Svelte i18n

- We use [svelte-i18n](https://github.com/kaisermann/svelte-i18n), which internally uses [format-js](https://formatjs.io/) for handling i18n.
- The source translation file is [en/dict.json](./mathesar_ui/src/i18n/languages/en/dict.json).
- To handle pluralization and other complexities, the source translation strings may utilize a special syntax called [JSON with ICU Plurals](https://help.transifex.com/en/articles/6220806-json-with-icu-plurals) (a subset of the [ICU format](https://unicode-org.github.io/icu/userguide/icu/i18n.html)).
- After making changes to your code, ensure that the source `/en/dict.json` file contains new translation strings, if any.
- Do not update other translation files. They will be pulled from our translation service provider when the translation process is complete.

## Translation process

- We use [Transifex](https://app.transifex.com/mathesar/mathesar/dashboard/) for managing our translation process.
- You'll need to be a member of the Mathesar organization in Transifex, inorder to work with translations. Please reach out to us for information on how to join. 

### For Translators

_(We're currently working on a workflow for translators. This section will be updated once we have a clear set of instructions to follow.)_

### For Maintainers

#### Automation

- We have automated sync between Transifex and the `develop` branch, via the GitHub integration feature provided by Transifex.
- The configuration for it is specified in the `.tx/integration.yml` file, and within the Transifex admin panel.
- Refer [Transfiex documentation](https://help.transifex.com/en/articles/6265125-github-installation-and-configuration) for more information.

#### Manually pushing and pulling translations

If you'd like to manually push or pull translations, follow the instructions in this section.

> **Warning**
>
> Only push and pull translations on the `develop` branch. Do not do it for other branches since this will overwrite the existing resources within Transifex.

1. Install the Transifex cli tool, `tx`, if you haven't already.

    ```
    curl -o- https://raw.githubusercontent.com/transifex/cli/master/install.sh | bash
    ```

    It can be installed in your host machine or on the docker container.

1. **Push** the updated source translation files:

    ```
    TX_TOKEN=<transifex_api_token> tx push -s
    ```

1. **Pull** the translations from Transifex:

    ```
    TX_TOKEN=<transifex_api_token> tx pull -f
    ```

1. Commit and push the changes to our repo.


## Opening a shell in the container

- If you need to do some work within the container you can open a bash shell via:

    ```
    docker exec -it mathesar_service_dev bash
    ```

- To open a PostgreSQL [psql](https://www.postgresql.org/docs/current/app-psql.html) terminal for the data in Mathesar:

    ```
    docker exec -it mathesar_dev_db psql -U mathesar
    ```


## Building Debian package

- On a Debian machine, install the following dependencies
    
    ```
    sudo apt install debhelper-compat dh-virtualenv libsystemd-dev libpq-dev libicu-dev pkg-config lsb-release python3-dev python3 python3-setuptools python3-pip python3-venv tar
    ```
- Setup Mathesar build environment.
   This step is useful only when testing locally is needed for building static files and for collecting them. We won't have a need for this step while using the build service as it will be using the source code from release assets which will contain these static files


- Install Python and Nodejs preferably on a Linux machine
- Run the following commands to set up the environment

    ```
    python3 -m venv ./mathesar-venv
    source ./mathesar-venv/bin/activate
    pip install -r requirements.txt
    sudo npm install -g npm-force-resolutions
    cd mathesar_ui && npm install --unsafe-perm && npm run build
    cd ..
    python manage.py collectstatic
    ```
  
- From the mathesar directory, run the build script to generate the debian package
  
    ```
    cd release-scripts && source build-debian.sh
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

> ERROR: for db Cannot start server db: driver failed programming external connectivity on endpoint mathesar_dev_db (70c521f468cf2bd54014f089f0051ba28e2514667): Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use.

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
