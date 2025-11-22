1. Remove Mathesar internal schemas.

    **If you'd like to continue using your PostgreSQL databases**, you can remove the schemas created for Mathesar's use during installation. For each database accessible through the Mathesar UI, the safe and easy way to do so is to use Mathesar's new "Disconnect Database" functionality. When disconnecting a database, choose the "Remove Mathesar's internal schemas" option to safely remove any Mathesar schemas.

    If that doesn't work, or doesn't work for all databases, you can perform the following manual steps instead:

    1. Connect to the database.

        ```
        psql -h <DB HOSTNAME> -p <DB PORT> -U <DB_USER> <DB_NAME>
        ```

    2. Delete the types schema.

        ```postgresql
        DROP SCHEMA mathesar_types CASCADE;
        ```

        !!! danger ""
            Deleting this schema will also delete any database objects that depend on it. Specifically, this will delete any data using Mathesar's custom data types.

    3. Delete the function schemas.

        ```postgresql
        DROP SCHEMA msar CASCADE;
        DROP SCHEMA __msar CASCADE;
        ```
