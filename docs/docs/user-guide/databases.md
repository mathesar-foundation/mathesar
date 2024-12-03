# Databases

Each installation of Mathesar can connect to multiple PostgreSQL databases. Connecting or creating your first database will likely be your first step in using Mathesar.

## What is a database

If you're using Mathesar as a spreadsheet alternative, you might be curious what makes a database different from a spreadsheet and why it matters. A database is a self-contained set of data stored within a rigid structure that maintains data integrity and allows for efficient data operations. There are many different kinds of databases, and Mathesar [works specifically with _PostgreSQL_](./index.md#postgres) databases, so that's what we'll focus on here.

Within a database, you can have multiple [tables](./tables.md) &mdash; much like you might have multiple _sheets_ within a spreadsheet. And within each table in your database, you'll have rows and columns, similar to a spreadsheet. But while a spreadsheet gives you a blank canvas to freely enter any data into any cell you choose, a database is more structured. Rows and columns must be explicitly added before you can enter data, and each column must have a name and a [data type](./data-types.md). In a database, rows are sometimes called "records".

The biggest superpower of databases (specifically _relational_ databases like PostgreSQL) is the ability for cells to reference records from another table. In PostgreSQL, this concept is called foreign key constraints, and Mathesar leverages it so you can model your data with [relationships](./relationships.md). If you've ever used `VLOOKUP` in a spreadsheet, you'll love using relationships in Mathesar!

## Connecting a database {:#connection}

Click the **Connect Database** button from the home page of your Mathesar application and follow the prompts.

Once you've connected a database, you can navigate to Mathesar's page for it where you can browse the database's [schemas](./schemas.md) and configure various settings for it.

Mathesar will remember the connection even after the application is shut down. Your Mathesar [user](./users.md) will be added as a [collaborator](./collaborators.md) on the database (along with the PostgreSQL [role](./roles.md) you entered). And the password you entered for that role will be stored in Mathesar's [internal database](#internal), encrypted using Mathesar's [SECRET_KEY](../administration/configuration.md#secret_key).

## Creating a new database

If you're starting your database from scratch with Mathesar you can either:

- Use Mathesar to create a new database within Mathesar's internal server and connect to it. This is a good option to get up and running quickly, but it might require more work later should you decide to set up periodic backups or connect other tools to the same database. Also, this option won't be possible if Mathesar was installed without an internal server.

    _OR_

- Use another tool to create your database on an external server and then connect Mathesar to it. You can administer that external server yourself, or choose from a variety of hosted PostgreSQL solutions such as [Amazon RDS](https://aws.amazon.com/rds/postgresql/pricing/), [Google Cloud SQL](https://cloud.google.com/sql/postgresql), [Supabase](https://supabase.com/database), and others.

## Database Permissions {:#permissions}

- **Owner:** In PostgreSQL, every database has a role set as its [owner](./roles.md#ownership).

    Only the owner can:
    
    - Drop the database
    - Manage database-level privileges
    - Transfer ownership

- **Granted Privileges:** Additionally, the following privileges on one database may be granted to specific roles in PostgreSQL:
    - `CONNECT`- Allows the role to connect to the database.
    - `CREATE`- Allows the role to create new schemas within the database.
    - `TEMPORARY`- Allows the role to create temporary tables within the database.

See the [PostgreSQL docs](https://www.postgresql.org/docs/17/ddl-priv.html) for more info.

To manage the owner and granted privileges for a database, navigate to the database page in Mathesar and click on the **Database Permissions** button at the top right.

!!! info "See also"
    To manage the access that Mathesar _users_ have to a database, go to **Database Settings** > **Collaborators**. See [Access Control](./access-control.md) for more information.

## Disconnecting a database

1. From the Mathesar home page, click on your database to its database page.
1. At the top right, click on the dropdown menu, and select "Disconnect Database".

Disconnecting a database will _not_ delete the database. It will still be accessible outside Mathesar, and you reconnect it in the future.

However, disconnecting your database will delete the Mathesar-specific metadata associated with objects in the database. This includes saved explorations, customized column display options, and customized record summary templates.

## Dropping a database

If you want to entirely remove all the data in your database by dropping the database from the PostgreSQL server, you'll need to do so outside of Mathesar via PostgreSQL itself.

We plan to add support for dropping databases in the future. If this is a feature you would like, please comment on this [issue](https://github.com/mathesar-foundation/mathesar/issues/3862) to let us know.

## Mathesar's internal database {:#internal}

Mathesar's philosophy is to keep as much of your data as possible inside your connected PostgreSQL database, structured consistently with the way it appears in the Mathesar interface.

Separate from your connected PostgreSQL database, Mathesar also maintains an internal database to store configuration relevant to the Mathesar application itself. While Mathesar does not allow you to work directly with this internal database, you might be interested to understand the distinction between it and your connected database. Below is a comparison of the data stored in each:

<table>
  <tbody>
  <tr>
    <th>Data in your connected database</th>
    <th>Data in Mathesar's internal database</th>
  </tr>
  <tr>
    <td>
      <ul>
        <li>
          The
          <a href="/user-guide/schemas/">schemas</a>
          and
          <a href="/user-guide/tables/">tables</a>
          you see from within Mathesar
        </li>
        <li>The rows, columns, and cells within those tables</li>
        <li>
          <a href="/user-guide/relationships/">Relationships</a>
          between those tables
        </li>
        <li>
          <a href="/user-guide/roles/">Roles</a>
          and their privileges
        </li>
      </ul>
    </td>
    <td>
      <ul>
        <li><a href="/user-guide/users/">Users</a></li>
        <li>Database connection credentials, including saved role passwords</li>
        <li><a href="/user-guide/collaborators/">Collaborators</a></li>
        <li><a href="/user-guide/metadata/">Metadata</a></li>
        <li><a href="/user-guide/data-explorer/">Saved Explorations</a></li>
      </ul>
    </td>
  </tr>
  </tbody>
</table>

