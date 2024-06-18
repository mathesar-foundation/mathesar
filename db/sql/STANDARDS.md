# SQL Code Standards

## Naming conventions

Because function signatures are used informationally in command-generated tables, horizontal space needs to be conserved. As a compromise between readability and terseness, we use the following conventions in variable naming:

| Object     | Naming abbreviation |
| --         | --                  |
| attribute  | `att`               |
| schema     | `sch`               |
| table      | `tab`               |
| column     | `col`               |
| constraint | `con`               |
| object     | `obj`               |
| relation   | `rel`               |

Textual names have the suffix `_name`, and numeric identifiers have the suffix `_id`.

Examples

- The OID of a table is `tab_id`
- The name of a column is `col_name`
- The attnum of a column is `col_id`

## Casing

We use `snake_case` for basically everything — schema names, function names, variables, and types.

## Code documentation

Every function should have a docstring-style code documentation block. Follow the syntax of existing functions when writing new ones.

## Quoting, escaping, SQL injection, and security

As of mid-2024, Mathesar is in the midst of a gradual transition from one pattern of quoting to another.

- **The old pattern** is used for all functions within the (deprecated) `__msar` schema and will eventually be refactored out.

    In this pattern, if the name of a database object is accepted as a function argument, stored as an intermediate variable, or returned from a function, then that name is _quoted_ in preparation for it to eventually be used in an SQL statement. For example, a table name of `foo bar` would be passed around as `"foo bar"`.

- **The new pattern** is used for all functions within the `msar` schema, and will be used going forward.

    In this pattern all names are passed around unquoted for as long as possible. Like above, this applies to names in function arguments, intermediate variables, and return values. They are only quoted at the latest possible point in their execution path, i.e. when they are put into SQL.

    One way to think about this pattern is:

    **If it _can_ be unquoted, then it _should_ be unquoted.**

    For example, if you're dealing with a plain table name such as `foo bar`, then leave it unquoted. If you need to qualify that table name with a schema too, then either store both values unquoted in some composite type (e.g. jsonb, tuple, custom type, etc) or store them _quoted_ in a string like `"my schema"."foo bar"`. That string represents a fragment of SQL, and because of the dot there is no way to leave the values unquoted. With fragments of SQL like this, utilize descriptive naming and helpful code comments to be extra clear about when a string represents an SQL fragment. Try not to pass around too many fragments of SQL if you can avoid it. Prefer to pass around raw, unquoted values when possible/easy.

From [OWASP](https://owasp.org/www-project-proactive-controls/v3/en/c4-encode-escape-data):

> Output encoding is best applied **just before** the content is passed to the target interpreter. If this defense is performed too early in the processing of a request then the encoding or escaping may interfere with the use of the content in other parts of the program.

## System catalog qualification

Always qualify system catalog tables by prefixing them with `pg_catalog.`. If you don't, then user-defined tables can shadow the system catalog tables, breaking core functionality.


