# Mathesar

Mathesar is an open source software project to help users store, organize, visualize, and collaborate on data. Our goal is to provide an intuitive user experience for non-technical users. Mathesar is backed by PostgreSQL, which gives it the flexibility to be interoperable with thousands of other existing tools and applications.

Potential use cases for Mathesar include publishing and exploring public datasets, running business processes such inventory management and project tracking, providing a ready-made interface for speedy data entry and custom reporting, collecting and processing data from large groups of people, simple data cleaning and analysis, and automatic web API generation.

We started building Mathesar in March 2021 and are making steady progress towards releasing an initial version of the project by spring 2022. Please visit [our public wiki](https://wiki.mathesar.org/) to learn more about the project.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Contributing](#contributing)
- [Local Development](#local-development)
  - [Developing in Windows](#developing-in-windows)
  - [Configuration Options](#configuration-options)
  - [Frontend](#frontend)
  - [Linting](#linting)
  - [Running tests](#running-tests)
  - [E2E integration tests](#e2e-integration-tests)
    - [Setting up the environment for E2E tests](#setting-up-the-environment-for-e2e-tests)
    - [Running E2E tests](#running-e2e-tests)
  - [Opening a shell in the container](#opening-a-shell-in-the-container)
  - [Troubleshooting](#troubleshooting)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Contributing

We actively encourage contribution! [Join our community](https://wiki.mathesar.org/community) and read through [our contributing guidelines](https://wiki.mathesar.org/community/contributing).

## Local Development

First, [ensure that you have Docker installed](https://docs.docker.com/get-docker/).

Clone the repository and then copy the `.env.example` file to `.env` like so:
```
cp .env.example .env
```

From the repository's root directory, run:
```
docker-compose up
```

If it's your first time running the application, you'll also need to run database migrations and install Mathesar types and functions:
```
docker exec mathesar_service python manage.py migrate
docker exec -it mathesar_service python install.py
```

You should now have a web server and database server running. Opening `http://localhost:8000` in your browser will open the application. For sample table data, you can create a new table in the UI using the `patents.csv` file found in `/mathesar/tests/data`. 

It is recommended that you keep the Docker containers running while you make changes to the code. Any change to the code made locally will sync to the container and the version deployed at `http://localhost:8000` will always be the latest local version of the code.

### Developing in Windows

Windows users who want to run the Mathesar Docker development environment in WSL are advised to clone the repository in a Linux filesystem. When the project resides in a Windows filesystem, WSL does not work well with hot module replacement (HMR), which is required for frontend development. Please refer to our [Common Issues wiki page](https://wiki.mathesar.org/engineering/common-issues), and the [frontend development README file](https://github.com/centerofci/mathesar/blob/master/mathesar_ui/README.md#developing-in-windows) for more details.

### Configuration Options

If you want to use Mathesar with a preexisting Postgres DB, modify the `DATABASES.mathesar_tables` entry of the `config/settings.py` file with appropriate connection details before installing the Mathesar types and functions by running `install.py` as described in the previous step. 

**Please don't do this unless you have full confidence in what you're doing since Mathesar is not stable yet and may make unexpected changes to the database that you connect to it.**

### Frontend
For more detailed information on Mathesar's frontend development, please refer the [readme file within mathesar_ui directory](https://github.com/centerofci/mathesar/blob/master/mathesar_ui/README.md).

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

### E2E integration tests

#### Setting up the environment for E2E tests

Running E2E integration tests requires a separate docker setup. The dockerfile for it can be found [here](Dockerfile.integ-tests).

Inorder to make use of it, you can change line 18 in docker-compose.yml:

```
# change this
dockerfile: Dockerfile

# to this
dockerfile: Dockerfile.integ-tests
```

If you are working on the frontend and would like to run integration tests regularly, you could make use of this for your default development environment setup.

#### Running E2E tests

The E2E tests require the server to be up and running. You can run the tests by executing the following command:
```
docker exec mathesar_service pytest integration_tests/
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
