# Importing data into Mathesar

Mathesar allows importing data in CSV, JSON and Excel format. It also attempts to automatically infer the data type of the columns.

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

If you un-check **"Use first row as header"**, then Mathesar will generate default names for the columns which you can edit later.

## Importing JSON data {:#json}

The JSON data must be structured in one of the following ways:

- **An array of objects**

    Each object produces one row in the table, and the object keys become column names. If a key is present is only one object, then the values for that column will be `NULL` in all other rows.

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

## Importing Excel data {:#excel}

The Excel file must have data structured in form of a table.

### Header rows

By default, Mathesar will use the first row of Excel data to name the columns.

If you un-check **"Use first row as header"**, then Mathesar will generate default names for the columns which you can edit later.

### Sheet index

By default, Mathesar will try to find data from the first sheet of the file.

If you provide **"sheet index"**, then Mathesar will look for the data in that sheet.

Our goal is to support whatever [`pandas.read_excel`](https://pandas.pydata.org/docs/reference/api/pandas.read_excel.html) supports.