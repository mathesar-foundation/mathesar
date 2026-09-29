# Install Mathesar on Easypanel

This guide walks you through how to deploy Mathesar on Easypanel.

??? tip "Easypanel vs. other deployment methods"
	Deploying using [Easypanel](https://easypanel.io) works really well for:

	- Users who want to self-host on their own server (VPS or bare metal) but still want a one-click, GUI-managed deployment.
	- Users who do not have the capacity or interest in manually managing server infrastructure, but don't want to depend on a third-party PaaS.
	- Users who want to run Mathesar alongside other self-hosted apps on the same server.

	[Railway](./install-railway.md) and [DigitalOcean](./install-digitalocean.md) also work well for a fully managed, hands-off setup. If you need more flexibility or configurability, we recommend using our [Docker Compose](./install-via-docker-compose.md) or [direct](./install-from-scratch.md) installation methods instead.


## Installation

### Step 1: Run the one-click deployer

[![Deploy on Easypanel][easypanel-btn]][easypanel-deploy]

[easypanel-btn]: https://easypanel.io/img/deploy-on-easypanel-40.svg
[easypanel-deploy]: https://easypanel.io/templates/mathesar

### Step 2: Create the application

**Press the "Deploy" button.**

Easypanel will provision Mathesar together with its own PostgreSQL database and a randomly generated `SECRET_KEY`. It will take a minute or two to boot.

### Step 3: Set up an admin user account

Navigate to your Mathesar installation using the domain Easypanel assigns it.

You'll be prompted to set up an admin user account the first time you open Mathesar. Just follow the instructions on screen.

### Step 4: Additional setup (optional)

Congratulations on your new Mathesar install!

Here are some other things you can do to complete your Mathesar setup, depending on your needs:

- [Connect your existing database(s) to Mathesar](../user-guide/databases.md#connection) or create a new database in the Mathesar UI to begin working with your data.
- Attach a custom domain to the Mathesar service from the Easypanel dashboard if you don't want to use the default generated domain.
