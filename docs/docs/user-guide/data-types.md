# Data Types

## PostgreSQL's Data Types

PostgreSQL requires that every table column has a predefined data type. These types serve to keep your data clean by ensuring that (for example) arbitrary text doesn't somehow end up in a column designated for numbers. This type system is quite powerful, but it can be complex. See the [PostgreSQL docs](https://www.postgresql.org/docs/current/datatype.html). There are a _lot_ of different types to choose from, and you can even define your own custom types.

## Mathesar's Data Types {:#ui-types}

Mathesar seeks to tame some of PostgreSQL's type system complexity by grouping similar PostgreSQL data types into user-friendly categories. We call these categories "_Mathesar_ data types" &mdash; or simply "data types" within Mathesar itself.

Every PostgreSQL data type maps to exactly one Mathesar data type; and one Mathesar data type can potentially map to multiple PostgreSQL data types. For example, Mathesar has one [Number](#number) data type which serves to simplify the _seven_ different PostgreSQL data types for numbers.

When creating a new column within Mathesar, you'll need to specify a Mathesar data type. Then Mathesar will create the column in PostgreSQL using the default PostgreSQL data type for your selected Mathesar data type. You can also modify the PostgreSQL data type later if needed and customize its type options in some cases.

The relatively concise set of Mathesar data types &mdash; along with their associated default PostgreSQL data types &mdash; provide a curated assortment of recommended types well-suited for most use cases. And your ability to customize the PostgreSQL data type for a Mathesar data type gives you the flexibility to handle more specialized cases as needed.

Each Mathesar data type is described in more detail below.

### Boolean

- **PostgreSQL types**
    - [`boolean`](https://www.postgresql.org/docs/current/datatype-boolean.html)
- **Formatting** options _(stored as [metadata](./metadata.md))_
    - Display a dropdown instead of a checkbox
    - Customize the text show within the two dropdown options

### Date

- **PostgreSQL types**
    - [`date`](https://www.postgresql.org/docs/current/datatype-datetime.html)
- **Formatting** options _(stored as [metadata](./metadata.md))_
    - Customize the format of the displayed date

### Date & Time

- **PostgreSQL types**
    - [`timestamp with time zone`](https://www.postgresql.org/docs/current/datatype-datetime.html) **(default)**
    - [`timestamp without time zone`](https://www.postgresql.org/docs/current/datatype-datetime.html)
- **Formatting** options _(stored as [metadata](./metadata.md))_
    - Customize the format of the displayed date and time

### Duration

Used to store a length of time, for example "1 hour" or "3 days"

- **PostgreSQL types**
    - [`interval`](https://www.postgresql.org/docs/current/datatype-datetime.html)
- **Formatting** options _(stored as [metadata](./metadata.md))_
    - Customize the format of the displayed duration

### Email

Used to store valid email addresses

- **PostgreSQL types**
    - `mathesar_types.email`

        This is a custom PostgreSQL type implemented by Mathesar. It is a [domain](https://www.postgresql.org/docs/17/sql-createdomain.html) over `text` with additional logic to validate that the input is a valid email address.

### Money

- **PostgreSQL types**

    - `mathesar_types.money` **(default)**

        This is custom PostgreSQL type implemented by Mathesar as a [domain](https://www.postgresql.org/docs/17/sql-createdomain.html) over [`numeric`](https://www.postgresql.org/docs/17/datatype-numeric.html).

        ??? question "`mathesar_types.money` vs `numeric`"
            Compared with `numeric`, the `mathesar_types.money` type only exists for: (A) compatibility with our custom casting functions that can import CSV data with currency symbols; and (B) indicate to the upper layers of the Mathesar application that this column is eligible for an additional "Currency Symbol" metadata field.

            You are welcome to store money values in Number columns, but you won't be able to display the values with a currency symbol.

    - [`money`](https://www.postgresql.org/docs/current/datatype-money.html)

        ??? question "`mathesar_types.money` vs `money`"
            Although PostgreSQL _does_ natively have a `money` type, we've chosen to recommend our custom PostgreSQL type for money in order to give your more control over the fractional precision for money columns. The fractional precision of the native `money` type is controlled by the [`LC_MONETARY`](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-LC-MONETARY) which is set at the database level and thus may not be granular enough or accessible enough for all Mathesar users to configure.

- **Formatting** options _(stored as [metadata](./metadata.md))_
    - Customize the number of decimal places displayed (e.g. 1.2 vs 1.20)
    - Customize the digit grouping (e.g. 1,000 vs 1000)
    - Customize the locale for number formatting (e.g. 1.000,00 vs 1,000.00)
    - Customize the currency symbol character
    - Customize the position of the currency symbol

### Number

- **PostgreSQL types**
    - [`numeric`](https://www.postgresql.org/docs/17/datatype-numeric.html) **(default)**
    - [`smallint`](https://www.postgresql.org/docs/17/datatype-numeric.html)
    - [`integer`](https://www.postgresql.org/docs/17/datatype-numeric.html)
    - [`bigint`](https://www.postgresql.org/docs/17/datatype-numeric.html)
    - [`decimal`](https://www.postgresql.org/docs/17/datatype-numeric.html)
    - [`real`](https://www.postgresql.org/docs/17/datatype-numeric.html)
    - [`double precision`](https://www.postgresql.org/docs/17/datatype-numeric.html)
- **Formatting** options _(stored as [metadata](./metadata.md))_
    - Customize the number of decimal places displayed (e.g. 1.2 vs 1.20)
    - Customize the digit grouping (e.g. 1,000 vs 1000)
    - Customize the locale for number formatting (e.g. 1.000,00 vs 1,000.00)

### Text

- **PostgreSQL types**
    - [`text`](https://www.postgresql.org/docs/17/datatype-character.html) **(default)**
    - [`char`](https://www.postgresql.org/docs/17/datatype-character.html)
    - [`varchar`](https://www.postgresql.org/docs/17/datatype-character.html)

### Time

- **PostgreSQL types**
    - [`time with time zone`](https://www.postgresql.org/docs/17/datatype-datetime.html) **(default)**
    - [`time without time zone`](https://www.postgresql.org/docs/17/datatype-datetime.html)
- **Formatting** options _(stored as [metadata](./metadata.md))_
    - Customize the format of the displayed time

### URL

- **PostgreSQL types**
    - `mathesar_types.uri`

        This is a custom PostgreSQL type implemented by Mathesar. It is a [domain](https://www.postgresql.org/docs/17/sql-createdomain.html) over `text` with additional logic to validate that the input is a valid uri address.

## Other PostgreSQL types

Mathesar has rudimentary support for other PostgreSQL types such as: `array`, `bytea`, `point`, `line`, `lseg`, `box`, `path`, `path`, `polygon`, `circle`, `cidr`, `inet`, `macaddr`, `macaddr8`, `bit`, `bit varying`, `tsquery`, `tsvector`, `json`, `jsonb`, `xml`, `pg_lsn`, `pg_snapshot`, `txid_snapshot`, `int4range`, `int8range`, `numrange`, `tsrange`, `tstzrange`, `daterange`.

In most cases Mathesar is able to _display_ data from such types, but the following limitations apply:

- Columns of these types cannot be created from within Mathesar
- Data entry is not yet supported
- Formatting cannot be applied

If you would like to request additional support for a type, please [open an issue](https://github.com/mathesar-foundation/mathesar/issues) requesting the feature. And if you find that an unsupported type is causing _other_ features to break, please note it as a bug.

