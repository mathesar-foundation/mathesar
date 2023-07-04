# Importing data into Mathesar

Mathesar allows importing data directly into tables using a CSV, TSV, or JSON file. It also provides an inbuilt type-inference logic that guesses the data type of the columns based on the provided data.

## Steps

1. After creating a schema, you will be able to see a **+ New Table** dropdown button. Click on the button and select **From Data Import** option.
2. **Upload a file** option will be selected as default. Browse through the files on your device or drag and drop them into the import pane.
3. A preview of the table will appear. You can edit the table name, column names, and their data types and select whether to display a column. Click on **✓ Confirm & create table button** once you are happy with the preview.

### Importing CSV, TSV files
Mathesar accepts all valid CSV and TSV files with consistent delimiter (default is ','). You can use the first row as a header when the table preview is shown. If the header is absent, Mathesar allocates default names (For example, 'Column 0', 'Column 1', and so on) to columns that can be edited later.

### Importing JSON files
Mathesar accepts the JSON files which have the data structured as either of these forms:
1. JSON object (data structured as key-value pairs). This will create a table with a single row of data. The keys of the object will be used as column names, and the values will be inserted into the row. Example:

```
{
    "name": "John",
    "age": 21,
    "friends": ["Bob", "Mary"]
}
```

2. JSON list of objects. The will create a table with columns names the same as the keys of the JSON objects. The example below creates a table with column names **first_name**, **last_name**, **gender**, **friends**, and **email** and adds two rows of data corresponding to the number of JSON objects. Missing keys in each object get __*null*__ for corresponding columns.

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

The JSON structures discussed above should follow standard JSON grammar. More about JSON syntax can be found using the links given below.

#### Important Links

- To know more about JSON, visit [here](https://www.json.org/).
- To know more about JSON syntax and grammar, visit [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON#full_json_grammar).
