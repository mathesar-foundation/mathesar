# Local development setup

## Stack
Mathesar is built using:
- [PostgreSQL](https://www.postgresql.org/) for the data storage
- [Python](https://www.python.org/) for the backend
- [Django](https://www.djangoproject.com/) for the web application
- [SQLAlchemy](https://www.sqlalchemy.org/) to talk to the database
- [Django REST Framework](https://www.django-rest-framework.org/) for the API 
- [Svelte](https://svelte.dev/) and [TypeScript](https://www.typescriptlang.org/) for the frontend


## Setup

First, [ensure that you have Docker installed](https://docs.docker.com/get-docker/).

Clone the repository and then copy the `.env.example` file to `.env` like so:

```
cp .env.example .env
```

From the repository's root directory, run:

```
docker compose --profile dev up
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

1. Install [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and do all of your development work within it.
1. Make sure you **clone the Mathesar git repository _within WSL_** so that the development files reside in a Linux filesystem.

    !!! tip
        If you happen to clone the git repository outside of WSL, then you fix it by running these commands from within WSL.

        ```
        git config --global core.autocrlf input
        sudo apt-get install -y dos2unix
        sudo find . -type f -exec dos2unix {} \;
        ```

        These commands install the `dos2unix` utility, which converts text files from the DOS/Microsoft Windows format (with CRLF line endings) to the Unix/Linux format (with LF line endings). Next, the find utility is used to locate all files (-type f) in the current directory (.) and its subdirectories, and the dos2unix command is then executed on each of them (-exec dos2unix ;).

1. Execute the `docker compose` command inside of WSL to begin local development

Refer to our [Common Issues wiki page](https://wiki.mathesar.org/engineering/common-issues), and the [frontend development README file](https://github.com/centerofci/mathesar/blob/master/mathesar_ui/README.md#developing-in-windows) for more details.


<!-- TODO: clean up this imported content from the wiki, incorporating it into the other content above -->
<!-- BEGIN WIKI CONTENT IMPORT -->

# Project Set-Up In Windows Environment
Windows users who want to run the Mathesar Docker development environment in WSL are advised to clone the repository in a Linux filesystem. 
If you have tried running the project in Windows you may ran into some issues including this 
```
service_1  | /usr/bin/env: ‘bash\r’: No such file or directory
service_1  | 2022/03/30 16:20:21 Command exited with error: exit status 127
```
The complete guide is given below.
## Pre-requisites
- We assume you have Windows 10 or higher.
- [Docker](https://docs.docker.com/get-docker/) is up and running properly in your system.

# Solution 
- First search for "Turn Windows features on or off", navigate to the bottom, and click the check-box named "Windows Subsystem For Linux".
- Now you have to install a Linux distro in your Windows system. Go to the Microsoft store, install any Linux distro (Ubuntu preferred), and launch. In order to set up a mount and view Windows files, use the following:
  ```
  # navigate to your desired file location e.g 
  cd /mnt/User/your_pc_name/Desktop/folder
   
  # Clone the repository using command
  git clone https://github.com/centerofci/mathesar.git
  ```
- Here you may run into some problems regarding permissions in some `.git-config` files. This means Ubuntu is not configured properly in your Windows machine. Restart your machine to fix this issue.

**Note:** You have to perform these previous steps for the first time only ! after you have cloned the repo from ubuntu console in linux file sysyem then you can  simple close ubuntu and start working on the project as other django projects in windows.

- Now that no Linux/Ubuntu console is needed; just open the project in vs-code(or any IDE you prefer) and follow along.
- Copy the `.env.example` file to `.env` like so:
  ```
  cp .env.example .env
  ```
- From the repository's root directory, run this command (powershell prefered):
  ```
  docker-compose up
  ```
- If it's your first time running the application, you'll also need to run database migrations and install Mathesar types and functions:
  ```
  docker exec mathesar_service sh -c "python manage.py migrate && python install.py"
  ```
- You should now have a web server and database server running. Opening `http://localhost:8000` in your browser will open the application. For sample table data, you can create a new table in the UI using the `patents.csv` file found in `/mathesar/tests/data`. 
- It is recommended that you keep the Docker containers running while you make changes to the code. Any change to the code made locally will sync to the container and the version deployed at `http://localhost:8000` will always be the latest local version of the code.

### Troubleshooting
- Running Script in powershell is disabled by default in windows , you have to change permission to run scripts  [Official Docs ](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-7.2) 
- Please refer to our [Common Issues wiki page](https://wiki.mathesar.org/engineering/common-issues) for instruction on troubleshooting common issues while setting up and running Mathesar.

<!-- END WIKI CONTENT IMPORT -->

## Configuration Options

If you want to use Mathesar with a preexisting Postgres DB, modify the `DATABASES.mathesar_tables` entry of the `config/settings.py` file with appropriate connection details before installing the Mathesar types and functions by running `install.py` as described in the previous step.

## Frontend

For more detailed information on Mathesar's frontend development, see [the README in the `mathesar_ui` folder](https://github.com/centerofci/mathesar/blob/master/mathesar_ui/README.md).

## Documentation

For more detailed information on working on Mathesar's documentation, see [the README in the `docs` folder](https://github.com/centerofci/mathesar/blob/master/docs/README.md).

## Development Notes
- It is recommended to rebuild Docker images when code changes are pulled from the remote server or when switching branches using the command:
  - `sudo docker compose --profile dev up --force-recreate --build dev-service`


## Demo mode

Mathesar can be run in "live demo mode". This creates a new database for every user session, adds a banner to the UI, and enables analytics, sent to the Mathesar team.

To run Mathesar in demo mode, you should add an environment variable to `.env`:

```sh
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
docker exec mathesar_service_dev pytest mathesar/ db/
```

for running a particular test,
```
docker exec mathesar_service_dev pytest -k "test_name"
```

For more options to run the pytest, please refer to the [pytest documentation](https://docs.pytest.org/en/latest/how-to/usage.html).

Frontend tests:

```
docker exec mathesar_service_dev bash -c "cd mathesar_ui && npm test"
```

## Opening a shell in the container

If you need to do some work on the container that's running the code, here's how you access it:

```
docker exec -it mathesar_service_dev bash
```

To open a PostgreSQL psql terminal for the data in Mathesar:

```
docker exec -it mathesar_db psql -U mathesar
```

## Troubleshooting

<!-- TODO: clean up this imported content from the wiki -->
<!-- BEGIN WIKI CONTENT IMPORT -->

# Hot module replacement doesn't work on windows
Hot module replacement, currently does not work when the project is present on a windows filesystem and WSL is used to run docker. This is a known limitation of WSL.

Moving the project to a linux filesystem should resolve this.

This issue https://github.com/centerofci/mathesar/issues/570 keeps track of workarounds and detailed discussions on common problems encountered while working on windows.

# npm audit Failures

> Fixing this issue is restricted only to [maintainers](/team). If you are facing this, please notify the maintainers on our [Matrix channels](/community), or raise an issue on GitHub.
{.is-warning}

If the `audit` check on your pull request fails, here are the steps to fix it:

* If the audit failure indicates that the issues are auto-fixable, the following commands need to be run to fix them:
	```
	npm audit fix
	npm install
	```
  
  Please make sure to run these within the container only. If you are running Mathesar locally, without Docker, make sure you use the same node and npm versions.
* If the issues are non auto-fixable, identify the packages that are vulnerable.
	- If they are directly used packages, update their versions.
  - If they are dependencies of packages used by us (most common), update the parent packages.
  - Most often, newer parent packages may not have been released yet. In which case, we can use the 'resolutions' field in package.json to force the version of packages. Make sure to only update it to the closest non-vulnerable minor release, in this case.
  - Force resolving dependencies to a particular version should only be done when the vulnerabilities are not false positives. [This article](https://overreacted.io/npm-audit-broken-by-design/) by Dan Abramov from the React team, gives a good explanation on why most reported vulnerabilities are false positives.

# Errors while running `docker-compose up`

## PostgreSQL server is running on your host machine

* If you you see the following error after running `docker-compose up`, then the port used by Postgres is already in use.

    > ERROR: for db Cannot start server db: driver failed programming external connectivity on endpoint mathesar_db (70c521f468cf2bd54014f089f0051ba28e2514667): Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use.

* Try stopping Postgres with:

  ```
  sudo service postgresql stop
  ```

 - Then run `docker-compose up` again.

> Note that you'll need to manually start your Postgres server on your host machine again if you want to continue working on other projects which rely on that. And the next time you restart your machine, you'll probably need to stop Postgres again before you can begin working on Mathesar.
{.is-warning}

<!-- END WIKI CONTENT IMPORT -->
