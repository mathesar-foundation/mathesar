# Troubleshooting Docker Compose Installation

!!! info "We are still testing the install process"
    We've tested this installation procedure on Windows, Mac, and a few Linux variants, but Mathesar is in its early stages so there might be unexpected issues. Please open a [GitHub issue](https://github.com/centerofci/mathesar/issues) if you run into any problems.

## Restarting installation

If something has gone wrong with the installation, you may need to restart the script. Two cases are possible:

1. The script has started the Docker environment for Mathesar. You can tell this happened if your terminal printed the message
   ```
   Next, we'll download files and start the server, This may take a few minutes.

   Press ENTER to continue.
   ```
   and you subsequently pressed `ENTER`. In this case, you must run the command

    === "Linux"
        ```sh
        sudo docker compose -f /etc/mathesar/docker-compose.yml  down -v
        ```

    === "MacOS"
        ```sh
        docker compose -f /etc/mathesar/docker-compose.yml  down -v
        ```
   and then run the installation script again.

2. The script hasn't yet started the Docker environment, i.e., you haven't seen the message printed above. In this case, you need only stop the script by pressing `CTRL+C`, and then run it again.

## When installing on Windows {:#windows}

!!! warning
    The process of installing and running has thus far been much better tested on MacOS and Linux than it has on Windows. Please [open issues](https://github.com/centerofci/mathesar/issues/new/choose) for any Windows-specific problems you encounter.

- During installation, choose "WSL 2" instead of "Hyper-V". WSL is the Windows Sub System for Linux and is required to run Mathesar.
- See [this tutorial](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers) for hints if you're having trouble getting Docker wired up properly.
- Make sure you're use the WSL command prompt (rather than DOS or PowerShell) when running the installation script and other commands.

## Docker versions

The most common problem we've encountered is users with out-of-date `docker` or `docker-compose` versions.

- To determine your `docker-compose` version, run `docker compose version`. (Note the lack of hyphen.) You need `docker-compose` version 2.7 or higher for the installation to succeed. Better if it's version 2.10 or higher.
- To determine your `docker` version, run `docker --version`. We've tested with `docker` version 23, but lower versions may work.

If you run `docker-compose --version` and see a relatively old version, try `docker compose version` and see whether it's different. The latter is the version that will be used in the script.

## Ports

You may see errors about various ports being unavailable (or already being bound). In this case, [uninstall Mathesar](./index.md#uninstall) to restart from a clean `docker` state, and choose non-default ports during the installation process for PostgreSQL, HTTP traffic, or HTTPS traffic as appropriate, e.g., using `8080` for HTTP traffic if `80` is unavailable. Note that if you customized the configuration directory, you must replace `/etc/mathesar` with that custom directory in the command.

## Connection problems

In order for Mathesar to install properly, it needs to download some artifacts from `https://raw.githubusercontent.com`. We've received some reports that this domain is blocked for some internet providers in India. If this is the case for you, consider routing around that problem via a custom DNS server, or using a VPN.

## Permissions

If you have permissions issues when the script begins running `docker` commands, double-check that your user is in the `sudoers` file. Try running `sudo -v`. If that gives an error, your user lacks needed permissions and you should speak with the administrator of your system.

## Getting more help

If you're having an issue not covered by this documentation, open an issue [on GitHub](https://github.com/centerofci/mathesar/issues).
