# One-click Install Mathesar on DigitalOcean App Platform

Install Mathesar to DigitalOcean in minutes using the simple instructions below.

## Why Choose DigitalOcean App Platform?

[DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) simplifies deploying, scaling, and managing Mathesar without worrying about underlying infrastructure management. It's ideal for:

- Beginners who need an easy, quick setup without delving into infrastructure specifics.
- Small to medium-sized teams looking for reliable hosting with minimal overhead.
- Developers who prefer easy scaling, clear pricing, and stability without needing to SSH into servers or manually manage configuration.

## Instructions for installing Mathesar to DigitalOcean App Platform

1. Use the DigitalOcean one-click install button to initialize a new Mathesar installation in DigitalOcean:
    [![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/mathesar-foundation/mathesar-digital-ocean/tree/main)
1. Create a Digital Ocean account and as payment information, if you do not have an existing account.
1. Secure your installation with a `SECRET_KEY` . Press the button below to generate a key, and automatically copy it.
    {% include 'snippets/generate-secret-key.md' %}
1. Add a `SECRET_KEY` environmemt variable. Click the "Edit" button next to the "Environment Variables" heading, then the "Add environment variable" button. When completed Digital Ocean should look something like this:
  ![A screenshot of DigitalOcean's UI to configure environment variables](../assets/images/digital-ocean-app-platform-config.png)
1. Press the "Create App" button.

In a few minutes, you'll have a live Mathesar installation ready to use! Digital Ocean will display your domain name and a link to visit your new site. You’ll be prompted to set up an admin user account the first time you open Mathesar. Just follow the instructions on screen.

## After installing Mathesar

Congratulations on your new Mathesar install! After getting up in running, you may want to take some additional steps:

### Connect your production database(s)

See our [instructions for connecting Databases to Mathesar](../user-guide/databases.md#connection) to begin working with your data.

### Add a custom domain name (optional)

By default, Digital Ocean will give your Mathesar installation its own secured domain name, like `https://mathesar-*.ondigitalocean.app/`.

You can easily add a custom domain name by following Digital Ocean's guide on [Adding a custom domain using their control panel](https://docs.digitalocean.com/products/app-platform/how-to/manage-domains/#custom-domain).
