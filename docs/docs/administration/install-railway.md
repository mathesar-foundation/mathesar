# Install Mathesar on Railway

This guide walks you through how to deploy Mathesar on Railway.

??? tip "Railway vs. other deployment methods"
	Deploying using Railway works really well for:

	- Users who are new to self-hosting but want a long-term, low-maintenance deployment.
	- Users who do not have the capacity or interest in manually managing server infrastructure, scaling, or observability.
	- Users who want to integrate Mathesar into a broader application stack using GUI tooling.

	[DigitalOcean](./install-digitalocean.md) also works well for this use case. If you need more flexibility or configurability, we recommend using our [Docker Compose](./install-via-docker-compose.md) or [direct](./install-from-scratch.md) installation methods instead.


## Installation

### Step 1: Run the one-click deployer

!!! info "Railway trial accounts"
	If you sign up with GitHub and your account meets Railway's [requirements](https://docs.railway.com/reference/pricing/free-trial#full-vs-limited-trial), you'll receive a "full" free trial and be able to install Mathesar immediately.

	Otherwise, you'll be placed on a "limited" trial, which doesn't support code deployment. Instead, Railway will prompt you to upgrade to one of their "Hobby"-tier monthly plans in order to deploy Mathesar.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/mathesar-official?referralCode=piCyQa)

### Step 2: Create the application

**Press the "Deploy" button.**

It will take a minute or two for Railway to set up your installation. Once ready, you will see your domain name and a link to visit your new Mathesar site.

### Step 3: Set up an admin user account

Navigate to your Mathesar installation using the link that Railway shows you.

You’ll be prompted to set up an admin user account the first time you open Mathesar. Just follow the instructions on screen.

### Step 4: Additional setup (optional)

Congratulations on your new Mathesar install!

Here are some other things you can do to complete your Mathesar setup, depending on your needs:

- [Connect your existing database(s) to Mathesar](../user-guide/databases.md#connection) or create a new database in the Mathesar UI to begin working with your data.
- [Set up a custom domain name in Railway](https://docs.railway.com/guides/public-networking#custom-domains) if you don't want to use their default domain e.g. `https://mathesar-*.up.railway.app`.
