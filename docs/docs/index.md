# Mathesar Documentation

## Welcome!

Mathesar is a self-hostable open source project that provides a spreadsheet-like interface to a PostgreSQL database. Our web-based interface helps you and your collaborators set up data models, edit data, and build custom reports &mdash; no technical skills needed. You can create a new PostgreSQL database while setting up Mathesar or use our UI to interact with an existing database (or do both).

## Try Mathesar

See our [live demo site](https://demo.mathesar.org/) to try Mathesar without installing anything.

## Install Mathesar

You can self-host Mathesar by following one of the guides below:

- [Install using Docker image](installation/docker/index.md) — the quickest way to get Mathesar running locally.
- [Install using Docker compose](installation/docker-compose/index.md) — a more robust production setup with separate reverse-proxy and database containers.
- [Install from scratch](installation/build-from-source/index.md) — an advanced setup that doesn't rely on Docker.

!!! info "More installation methods coming soon"
    We're working on supporting additional installation methods, and we'd appreciate feedback on which ones to prioritize. Please comment [on this issue](https://github.com/centerofci/mathesar/issues/2509) if you have thoughts.

## Use Mathesar

Mathesar should be pretty intuitive to use. More documentation is coming soon, but for now, we've written some documentation for some things that could be tricky.

- [Syncing Database Changes](./user-guide/syncing-db.md)
- [Users & Access Levels](./user-guide/users.md)

## Contribute to Mathesar

As an open source project, we actively encourage contribution! Get started by reading our [Contributor Guide](https://github.com/centerofci/mathesar/blob/develop/CONTRIBUTING.md).

## Donate

We're a non-profit and your donations help sustain our core team. You can donate via [GitHub](https://github.com/sponsors/centerofci) or [Open Collective](https://opencollective.com/mathesar).
