# Troubleshooting

## Docker versions

The most common problem we've encountered is users with out-of-date `docker` or `docker-compose` versions.

- To determine your `docker-compose` version, run `docker compose version`. (Note the lack of hyphen.) You need `docker-compose` version 2.0 or higher for the installation to succeed. Better if it's version 2.10 or higher.
- To determine your `docker` version, run `docker --version`. We've tested with `docker` version 23, but lower versions may work.

If you run `docker-compose --version` and see a relatively old version, try `docker compose version` and see whether it's different. The latter is the version that will be used in the script.

## Ports
You may see errors about various ports being unavailable (or already being bound). In this case, please restart from a clean `docker` state, and choose non-default ports during the installation process for PostgreSQL, HTTP traffic, or HTTPS traffic as appropriate. 

For instance, you could choose port `8080` for HTTP traffic if port `80` is unavailable.

## Permissions

If you have permissions issues when the script begins running `docker` commands, please double-check that your user is in the `sudoers` file. Try running `sudo -v`. If that gives an error, your user lacks needed permissions and you should speak with the administrator of your system.

## Getting more help

If you're having an issue not covered by this documentation, please open an issue [on GitHub](https://github.com/centerofci/mathesar/issues).