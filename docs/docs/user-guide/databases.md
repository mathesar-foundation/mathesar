# Databases

Each installation of Mathesar can connect to multiple PostgreSQL databases. Connecting your first database will likely be your first step in using Mathesar.

## PostgreSQL servers

Every PostgreSQL database lives within a PostgreSQL server.

- **External servers:** Mathesar can connect to any Internet-exposed PostgreSQL server to access the databases within it. We'll refer to these PostgreSQL servers as "external servers".

- The **Internal Server:** Most Mathesar installations have an internal PostgreSQL server which the Mathesar application controls and utilizes for storage of application-specific metadata.

## Creating a new database

If you're starting your database from scratch with Mathesar you can either:

- Use Mathesar to create a new database within Mathesar's internal server and connect to it. This is a good option to get up and running quickly, but it might require more work later should you decide to set up periodic backups or connect other tools to the same database. Also, this option won't be possible if Mathesar was installed without an internal server.

    _OR_

- Use another tool to create your database on an external server and then connect Mathesar to it. You can administer that external server yourself, or choose from a variety of hosted PostgreSQL solutions such as [Amazon RDS](https://aws.amazon.com/rds/postgresql/pricing/), [Google Cloud SQL](https://cloud.google.com/sql/postgresql), [Supabase](https://supabase.com/database), and others.

## Connecting a database

Click the **Connect Database** button from the home page of your Mathesar application and follow the prompts.

Once you've connected a database, you can navigate to Mathesar's page for it where you can browse the database's schemas and configure various [permissions](./permissions.md) for it.

Mathesar will remember the connection even after the application is shut down. Your Mathesar user will be added as a "collaborator" on the database (along with the PostgreSQL role you entered). And the password you entered for that role will be stored in Mathesar's internal database, encrypted using Mathesar's [SECRET_KEY](../configuration/env-variables.md#secret_key).

