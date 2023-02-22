<p align="center">
    <img src="https://user-images.githubusercontent.com/845767/218793207-a84a8c9e-d147-40a8-839b-f2b5d8b1ccba.png" width=450px alt="Mathesar logo"/>
</p>
<p align="center"><b>An intuitive UI for Postgres databases, for users of all technical skill levels.</b></p>
<p align="center">
    <img alt="License" src="https://img.shields.io/github/license/centerofci/mathesar">
    <img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/centerofci/mathesar">
    <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/w/centerofci/mathesar">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/centerofci/mathesar">
</p>

<p align="center">
  <a href="https://mathesar.org?ref=github-readme" target="_blank">Website</a> • <a href="https://docs.mathesar.org?ref=github-readme" target="_blank">Docs</a> • <a href="https://wiki.mathesar.org/en/community/matrix" target="_blank">Matrix (chat)</a> • <a href="https://wiki.mathesar.org/" target="_blank">Wiki</a>
</p>


# Mathesar

Mathesar is a straightforward open source tool that provides a **spreadsheet-like interface** to a PostgreSQL **database**. Our web-based interface helps you and your collaborators work with data more independently and comfortably – **no technical skills needed**.

You can use Mathesar to build **data models**, **enter data**, and even **build reports**. You host your own Mathesar installation, which gives you ownership, privacy, and control of your data.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Contributing](#contributing)
  - [Help with documentation](#help-with-documentation)
- [Local Development](#local-development)
  - [Developing demo data sets and functionality](#developing-demo-data-sets-and-functionality)
  - [Developing in Windows](#developing-in-windows)
  - [Configuration Options](#configuration-options)
  - [Frontend](#frontend)
  - [Linting](#linting)
  - [Running tests](#running-tests)
  - [E2E integration tests](#e2e-integration-tests)
  - [Opening a shell in the container](#opening-a-shell-in-the-container)
  - [Troubleshooting](#troubleshooting)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Status
- [x] **Pre-release**: Initial development, not yet ready for deployment.
- [ ] **Public Alpha**: You can install and deploy Mathesar on your server. Go easy on us!
- [ ] **Public Beta**: Stable and feature-rich enough to implement in production
- [ ] **Public**: Production-ready

We are currently in Public Alpha.

## Join our community!
The Mathesar team is on [Matrix](https://wiki.mathesar.org/en/community/matrix) (chat service). We also have [mailing lists](https://wiki.mathesar.org/en/community/mailing-lists) and the core team discusses day-to-day work on our developer mailing list. 

We actively encourage contribution! Read through [our contributing guidelines](https://wiki.mathesar.org/community/contributing) to get started.

## Screenshots
*TBD*

## Features
- **Built on Postgres**: Connect to an existing Postgres database or set one up from scratch.
- **Set up your data models**: Easily create and update Postgres schemas and tables.
- **Data entry**: Use our spreadsheet-like interface to view, create, update, and delete table records.
- **Filter, sort, and group**: Quickly slice your data in different ways.
- **Query builder**: Use our Data Explorer to build queries without knowing anything about SQL or joins.
- **Schema migrations**: Transfer data between tables in two clicks.
- **Uses Postgres features**: Mathesar uses and manipulates Postgres schemas, primary keys, foreign keys, constraints and data types. e.g. "Links" in the UI are foreign keys in the database.
- **Custom data types**: Custom data types for emails and URLs (more coming soon), validated at the database level.
- **Basic access control**: Users can have Viewer (read-only), Editor (can only edit data, but not data structure), or Manager (can edit both data and its structure) roles.

## Self-hosting
Please see [our documentation](https://docs.mathesar.org/) for instructions on installing Mathesar on your own server.

## Local development setup

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

### Developing demo data sets and functionality

For this, you should add an environment variable to `.env`:

``` sh
DJANGO_SETTINGS_MODULE=demo.settings
```

### Developing in Windows

Windows users who want to run the Mathesar Docker development environment in WSL are advised to clone the repository in a Linux filesystem. When the project resides in a Windows filesystem, WSL does not work well with hot module replacement (HMR), which is required for frontend development. Please refer to our [Common Issues wiki page](https://wiki.mathesar.org/engineering/common-issues), and the [frontend development README file](https://github.com/centerofci/mathesar/blob/master/mathesar_ui/README.md#developing-in-windows) for more details.

### Configuration Options

If you want to use Mathesar with a preexisting Postgres DB, modify the `DATABASES.mathesar_tables` entry of the `config/settings.py` file with appropriate connection details before installing the Mathesar types and functions by running `install.py` as described in the previous step. 

### Frontend

For more detailed information on Mathesar's frontend development, see [Mathesar UI](./mathesar_ui/README.md).

### Documentation

For more detailed information on working on Mathesar's documentation, see [Mathesar Docs README](./docs/README.md).

### Linting

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

### Running tests

If you'd like to run tests before pushing, here's how you do it:

Backend tests:
```
docker exec mathesar_service pytest mathesar/ db/
```

Frontend tests:
```
docker exec mathesar_service bash -c "cd mathesar_ui && npm test"
```

### Opening a shell in the container

If you need to do some work on the container that's running the code, here's how you access it:
```
docker exec -it mathesar_service bash
```

To open a PostgreSQL psql terminal for the data in Mathesar:
```
docker exec -it mathesar_db psql -U mathesar
```

### Troubleshooting
Please refer to our [Common Issues wiki page](https://wiki.mathesar.org/engineering/common-issues) for instruction on troubleshooting common issues while setting up and running Mathesar.

## License
Mathesar is open source under the GPLv3 license - see [LICENSE](LICENSE). It also contains derivatives of third-party open source modules licensed under the MIT license. See the list and respective licenses in [THIRDPARTY](THIRDPARTY).
