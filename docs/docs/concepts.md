# Conceptual overview

<!--

TODO:

- Help the reader understand the difference between Postgres and Mathesar. Help them understand that Postgres is only one of many different types of databases.
- link to Postgres site
- Explain that Mathesar works only with Postgres, and explain why
- Explain the difference between "databases", "schemas", and "tables", making it clear when/why a user should choose a separate _database_ vs a separate _schema_.

-->

Mathesar provides a spreadsheet-like interface to a PostgreSQL database. Mathesar works by connection to an Postgres server using a database credentials with appropriate [permissions](#permissions) provided by you, inferring the database structure by reading through the [catalog tables](https://www.postgresql.org/docs/current/catalogs.html) which we call as reflection and presenting the reflected data in a easy to use UI. We also help the user modify, perform SQL operations using the UI by converting the actions done using to equivalent SQL command and running it on the Postgres database. 

## PostgreSQL permissions {:#permissions}

## Mathesar schemas {:#schemas}

## Reflection {:#reflection}
