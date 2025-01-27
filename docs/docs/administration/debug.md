# Debugging Mathesar

If your Mathesar installation isn't working as expected, you can use our `mathesar-debug` Docker image that adds more debugging output to the console and more verbose errors in the browser when something goes wrong. The additional information logged should help you or the Mathesar team diagnose the installation issue.

## Use the debugging Mathesar docker image

The debugging-enabled Mathesar docker image is available at the `mathesar/mathesar-debug` Docker repo. It's the same as the `mathesar/mathesar` image, other than adding more debugging output. To set it up:

1. Run Mathesar with the `mathesar/mathesar-debug` image, and then
1. Observe and report any additional output or clues to the Mathesar team.

### Docker Compose

Just replace the line

```
    image: mathesar/mathesar:latest
```

with

```
    image: mathesar/mathesar-debug:latest
```

### Basic Mathesar docker image

If you are just trying the Mathesar Docker image directly as instructed in the [introduction](../index.md#try-locally), replace the command

```
docker run -it --name mathesar -p 8000:8000 mathesar/mathesar:latest
```

with 

```
docker run -it --name mathesar -p 8000:8000 mathesar/mathesar-debug:latest
```

### Other setups

The debugging docker image should work anywhere the production image works. This means you can just replace any pull or run of the image `mathesar/mathesar:latest` with `mathesar/mathesar-debug:latest`.
