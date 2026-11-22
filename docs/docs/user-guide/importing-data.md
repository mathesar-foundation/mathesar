# Importing data into Mathesar

Mathesar allows importing data in CSV format. It also attempts to automatically infer the data type of the columns.

## Importing CSV data {:#csv}

### Delimiters

Fields in the CSV data may be delimited by any of the following characters:

| Name | Character | Notes |
| -- | -- | -- |
| Comma | `,` | A traditional CSV file (a "**C**omma **S**eparated **V**alue" document) |
| Tab | _(not printable)_ | This is sometimes referred to as a _TSV_ file (a "**T**ab **S**eparated **V**alue" document) |
| Semicolon | `;` |  |
| Colon | `:` |  |
| Pipe | `|` |  |

### Header rows

By default, Mathesar will use the first row of CSV data to name the columns.

To import the first row as data instead:

- When you import into a new table, choose **"Set generic column names, keeping the first row as data"** under **Column Names** in the preview. Mathesar will generate default names for the columns, which you can edit later.
- When you import into an existing table, set **Content of First Row** to **"Data to be Imported"**.

<!-- TODO: Uncomment the content below when we've fully implemented JSON import across the stack -->
<!--

## Importing JSON data {:#json}

The JSON data must be structured in one of the following ways:

- **An array of objects**

    Each object produces one row in the table, and the object keys become column names. If a key is present in only one object, then the values for that column will be `NULL` in all other rows.

    ```json
    [
      {
        "first_name": "Matt",
        "last_name": "Murdock",
        "gender": "Male",
        "friends": ["Stick", "Foggy"]
      },
      {
        "first_name": "John",
        "last_name": "Doe",
        "email": "jd@example.org",
        "gender": "Male"
      }
    ]
    ```

- **A single object**

    This is similar to above but produces a table with only one row.

    ```json
    {
      "name": "John",
      "age": 21,
      "friends": ["Bob", "Mary"]
    }
    ```

Our goal is to support whatever [`pandas.json_normalize`](https://pandas.pydata.org/docs/reference/api/pandas.json_normalize.html) supports.

-->
