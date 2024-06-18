# SQL code

A substantial amount of Mathesar's application logic is implemented directly in the PostgreSQL database layer. This directory holds the code for that logic, as written in PL/pgSQL.

Also see our [SQL code standards](./STANDARDS.md) when making changes to the SQL code.


## Schemas

Mathesar installs multiple schemas in the PostgreSQL database for itself to run. We use these internal schemas to hold our custom functions and types.

### msar

This is the main schema where we define Mathesar-specific functionality.

### __msar

This is a legacy schema that is now **deprecated**. Try to avoid using it if you can.

It was originally intended for private use within the Mathesar SQL layer (not to be called by the service layer). So if you do use this schema, don't call its functions from within the service layer.

### mathesar_types

This schema holds types which the user might utilize in their own tables as well as types for our internal use.


## Testing

SQL code is tested using [pgTAP](https://pgtap.org/).

- Run all tests:

    ```
    docker exec mathesar_dev_db /bin/bash /sql/run_tests.sh -v
    ```

- Run tests having names which contain `foo_bar`:

    ```
    docker exec mathesar_dev_db /bin/bash /sql/run_tests.sh -v -x foo_bar
    ```


## When modifying the set of Mathesar-internal schemas

The names of all schemas managed by Mathesar in this SQL is also duplicated in [constants.py](../constants.py). Any changes to these schema name (e.g. adding a new internal schema) must be propagated there too.

