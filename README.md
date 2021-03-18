# Mathesar

Mathesar is a product to help users of all skill levels store, manipulate, and visualize data. More information coming soon.

## Local Development

First, [ensure that you have Docker installed](https://docs.docker.com/get-docker/).

From this directory, run:
```
docker-compose up
```
You should now have a web server and database server running. Opening `http://localhost:8000` in your browser will open the application.

You run database migrations like so:
```
docker exec -it mathesar_web_1 python manage.py migrate
```
You can also open a shell in the container running Django using:
```
docker exec -t mathesar_web_1 bash
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
