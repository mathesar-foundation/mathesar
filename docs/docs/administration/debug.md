# Debugging Mathesar

If your Mathesar installation isn't working as expected, you can prefix the docker command with `DEBUG=true` to add additional debugging output to the console and more verbose errors in the browser when something goes wrong. The additional information logged should help you or the Mathesar team diagnose any installation issues.

### With Docker Compose

When debugging Mathesar's recommended [docker compose](../administration/install-via-docker-compose.md) installation method, add `DEBUG=true` to the beginning of the docker compose command:

```diff
- docker compose -f docker-compose.yml up
+ DEBUG=true docker compose -f docker-compose.yml up
```

### With the basic Mathesar docker image

If you are just trying the Mathesar Docker image directly as instructed in the [introduction](../index.md#try-locally), you will follow the same approach of setting `DEBUG=true`:

```diff
- docker run -it --name mathesar -p 8000:8000 mathesar/mathesar:latest
+ DEBUG=true docker run -it --name mathesar -p 8000:8000 mathesar/mathesar:latest
```

### Before version 0.2.1

Previous versions of Mathesar used a dedicated debugging image called `mathesar/mathesar-debug`. These images will not be supported or created for Mathesar versions 0.2.1 or higher.
