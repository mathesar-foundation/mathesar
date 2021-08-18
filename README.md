# Mathesar

Mathesar is a project to make databases easier to use for non-technical users. Our aim is help users of all skill levels store, manipulate, visualize, and collaborate with others on data.

We are currently in early development and hope to release an alpha version by late 2021. Please see the [Mathesar wiki](https://wiki.mathesar.org/) for more information about the project.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Contributing](#contributing)
- [Local Development](#local-development)
  - [Linting](#linting)
  - [Running tests](#running-tests)
  - [Opening a shell in the container](#opening-a-shell-in-the-container)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Contributing

We actively encourage contribution! [Join our community](https://wiki.mathesar.org/community) and read through [our contributing guidelines](https://wiki.mathesar.org/community/contributing).

## Local Development

First, [ensure that you have Docker installed](https://docs.docker.com/get-docker/).

Then, copy the `.env.example` file to `.env` like so:
```
cp .env.example .env
```

From the repository's root directory, run:
```
docker-compose up
```
You should now have a web server and database server running. Opening `http://localhost:8000` in your browser will open the application.

If it's your first time running the application, you'll also need to run database migrations and install Mathesar types and functions:
```
docker exec mathesar_web_1 python manage.py migrate
docker exec -it mathesar_web_1 python install.py
```

If you want to use Mathesar with a preexisting Postgres DB, modify the `DATABASES.mathesar_tables` entry of the `config/settings.py` file with appropriate connection details before installing the Mathesar types and functions with the previous step.

For sample table data, you can use the `patents.csv` file found in `/mathesar/tests/data`. 

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
docker exec mathesar_web_1 pytest
```

Frontend tests:
```
docker exec mathesar_ui_1 npm test
```

### Opening a shell in the container

If you need to do some work on the container that's running the code, here's how you access it:

Backend:
```
docker exec -it mathesar_web_1 bash
```

Frontend:
```
docker exec -it mathesar_ui_1 bash
```

## License

Mathesar is open source under the GPLv3 license - see [LICENSE](LICENSE). It also contains derivatives of third-party open source modules licensed under the MIT license. See the list and respective licenses in [THIRDPARTY](THIRDPARTY).
