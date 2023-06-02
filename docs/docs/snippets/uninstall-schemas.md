1. Remove Mathesar internal schemas.

    **If you connected Mathesar to a database**, the installation process would have created new schemas for Mathesar's use. You can remove them from the database as follows:

    1. Connect to the database.

        ```
        psql -h <DB HOSTNAME> -p <DB PORT> -U <DB_USER> <DB_NAME>
        ```

    2. Delete the types schema.

        ```postgresql
        DROP SCHEMA mathesar_types CASCADE;
        ```

        !!! danger ""
            Deleting this schema will also delete any database objects that depend on it. This should not be an issue if you don't have any data using Mathesar's custom data types.

    3. Delete the function schemas.

        ```postgresql
        DROP SCHEMA msar CASCADE;
        DROP SCHEMA __msar CASCADE;
        ```
