# Importing data into Mathesar

Mathesar allows importing data directly into tables using a *SV file (including CSV and TSV files), or JSON file. It also attempts to automatically infer the data type of the columns.

### Importing CSV, TSV and other *SV files
Currently supported delimiters are [commas, tabs, colons, pipes, semicolon](https://github.com/centerofci/mathesar/blob/3eae659ec5a9447fdc91780876edbe76ace68a06/mathesar/imports/csv.py#L17). You can use the first row as a header when the table preview is shown. If the header is absent, Mathesar allocates default names (For example, 'Column 0', 'Column 1', and so on) to columns that can be edited later.

### Importing JSON files
Mathesar accepts the JSON files if they are structured in one of these ways:
1. A single object structured as key-value pairs. This will create a table with a single row. The keys of the object will be used as column names, and the values will be inserted into the row. Example:

```
{
    "name": "John",
    "age": 21,
    "friends": ["Bob", "Mary"]
}
```

2. List of objects. The will create a table with columns names the same as the keys of the JSON objects. The example below creates a table with column names **first_name**, **last_name**, **gender**, **friends**, and **email** and adds two rows of data corresponding to the number of JSON objects. Missing keys in each object get __*null*__ for corresponding columns.

```
[
    {
        "first_name":"Matt",
        "last_name":"Murdock",
        "gender":"Male",
        "friends": ["Stick", "Foggy"]
    },
    {
        "first_name":"John",
        "last_name":"Doe",
        "email":"jd@example.org",
        "gender":"Male",
    },
]
```

Our goal is to support whatever [`pandas.json_normalize`](https://pandas.pydata.org/docs/reference/api/pandas.json_normalize.html) supports.
