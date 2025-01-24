# Debug Mathesar

For now, we only support turning on Debugging by using our special docker image. More methods will follow in future releases.

## Use the debugging Mathesar docker image

There is a debugging-enabled Mathesar docker image available at `mathesar/mathesar-debug` that is the same as the `mathesar/mathesar` image, except that it has more debugging output available in the console where it's run, and it also produces more verbose errors in the browser when something goes wrong.

You can use this image to figure out (or to help the Mathesar team figure out) what's wrong if your Mathesar installation isn't working as expected. The procedure is to

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
