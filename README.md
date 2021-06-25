# Mathesar

Mathesar is a product to help users of all skill levels store, manipulate, and visualize data.

Please see our [Read the Docs site](https://mathesar.readthedocs.io/) for more information.

## Local Development

First, [ensure that you have Docker installed](https://docs.docker.com/get-docker/).

Then, copy the `.env.example` file to `.env` like so:
```
cp .env.example .env
```

From this directory, run:
```
docker-compose up
```
You should now have a web server and database server running. Opening `http://localhost:8000` in your browser will open the application.

You run database migrations like so:
```
docker exec mathesar_web_1 python manage.py migrate
```

You install Mathesar types and functions like so:
```
docker exec -it mathesar_web_1 python install.py
```

If you want to use Mathesar with a preexisting Postgres DB, modify the `DATABASES.mathesar_tables` entry of the `config/settings.py` file with appropriate connection details before installing the Mathesar types and functions with the previous step.

#### Running tests

Backend:
```
docker exec mathesar_web_1 pytest
```
Frontend:
```
docker exec mathesar_ui_1 npm test
```

#### Opening a shell in the container

Backend:
```
docker exec -it mathesar_web_1 bash
```

Frontend:

```
docker exec -it mathesar_ui_1 bash
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
