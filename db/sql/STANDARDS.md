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

    For example, if you're dealing with a plain table name such as `foo bar`, then definitely leave it unquoted.
    
    To hone in on an edge case, let's say you need to qualify that table name with a schema name too. In this case try to handle and store both values (schema name and table name) separately (unquoted) as much as possible. You can use separate variables, separate arguments, or a composite type for return values. As a last resort, you can store the qualified name quoted in an SQL fragment string like `"my schema"."foo bar"`. We have some code like this already, but it's not ideal. Because of the dot in that SQL fragment, there is no way to leave the values unquoted. With fragments of SQL like this, take care to utilize descriptive naming and helpful code comments to be extra clear about when a string represents an SQL fragment. But in general try to avoid passing around SQL fragments if you can. Prefer to pass around raw unquoted values. Or better yet, pass around unique identifiers like OIDs when possible.

From [OWASP](https://owasp.org/www-project-proactive-controls/v3/en/c4-encode-escape-data):

> Output encoding is best applied **just before** the content is passed to the target interpreter. If this defense is performed too early in the processing of a request then the encoding or escaping may interfere with the use of the content in other parts of the program.

## System catalog qualification

Always qualify system catalog tables by prefixing them with `pg_catalog.`. If you don't, then user-defined tables can shadow the system catalog tables, breaking core functionality.

## Casting OIDs to JSON

Always cast OID values to `bigint` before putting them in JSON (or jsonb).

_Don't_ cast OID values to `integer`.

This is because the [`oid` type](https://www.postgresql.org/docs/current/datatype-oid.html) is an _unsigned_ 32-bit integer whereas the `integer` type is a _signed_ 32-bit integer. That means it's possible for a database to have OID values which don't fit into the `integer` type.

For example, putting a large OID value into JSON by casting it to an integer will cause overflow:

```SQL
SELECT jsonb_build_object('foo', 3333333333::oid::integer); -- ❌ Bad
```

> `{"foo": -961633963}`

Instead, cast it to `bigint`

```SQL
SELECT jsonb_build_object('foo', 3333333333::oid::bigint); -- ✅ Good
```

> `{"foo": 3333333333}`

