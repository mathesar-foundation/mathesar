# Tables

## What is a table?

All relational databases, including PostgreSQL, organize data into tables (also known as "relations") containing rows, columns, and cells. Much like a single spreadsheet might have multiple _sheets_ within it, a single database will typically have several &mdash; or sometimes several _dozen_ &mdash; tables within it. Unlike most spreadsheets though, database tables are usually highly interconnected. In a database, [relationships](./relationships.md) offer a robust mechanism for one cell to reference one record in another table. By leveraging relationships, we can unlock the ability to model complex data structures via multiple linked tables.

## Managing tables

Mathesar lets you add/remove/rename tables from within the database page. You can also add descriptions to your tables which are stored in PostgreSQL as [COMMENTs](https://www.postgresql.org/docs/current/sql-comment.html). 

Keep in mind that your ability to alter tables may be limited by [access control](./access-control.md).

## Table Permissions {:#permissions}

- **Owner:** In PostgreSQL, every table has a role set as its [owner](./roles.md#ownership).

    Only the owner can:
    
    - Drop the table
    - Alter the table's columns
    - Manage table-level privileges
    - Transfer ownership

- **Granted Privileges:** Additionally, the following privileges on one table may be granted to specific roles in PostgreSQL:

    - `SELECT` - Allows reading data from the table
    - `INSERT` - Allows creation of new records within the table.
    - `UPDATE` - Allow updating existing records within the table.
    - `DELETE` - Allow deletion of records from the table.
    - `TRUNCATE` - Allows the deletion of all records from the table at once
    - `REFERENCES` - Allow creation of foreign key constraints that [reference](./relationships.md) the table.
    - `TRIGGER` - Allow creation of triggers on the table.

See the [PostgreSQL docs](https://www.postgresql.org/docs/17/ddl-priv.html) for more info.

To manage the owner and granted privileges for a table, navigate to the table page in Mathesar and click on the **Table Permissions** button at the top right.
