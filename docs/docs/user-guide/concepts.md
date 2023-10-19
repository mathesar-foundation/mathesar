# Conceptual overview

Mathesar provides a spreadsheet-like interface to a PostgreSQL database. Mathesar works by connection to an Postgres server using a database credentials with appropriate [permissions](#permissions) provided by you, inferring the datbase structure by reading through the [catalog tables](https://www.postgresql.org/docs/current/catalogs.html) which we call as reflection and presenting the reflected data in a easy to use UI. We also help the user modify, perform SQL operations using the UI by converting the actions done using to equivalent SQL command and running it on the Postgres database. 

## PostgreSQL permissions {:#permissions}

## Mathesar schemas {:#schemas}

## Reflection {:#reflection}
