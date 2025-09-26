# File columns in Mathesar

!!! question "Help us refine file storage!"
    We would like to support a wide variety of backends, storage formats, and use cases for file storage. If you need something beyond what’s currently documented, [schedule a call with us](https://cal.com/mathesar/users) to let us know your requirements.

Mathesar supports **file columns** which allow you to attach and interact with files of any type. These columns make it easy to store and preview files alongside your structured data.

- All file types are supported.
- One file
- Image files will display a **thumbnail preview**, which can be clicked to view a larger version.
- Files can always be **downloaded**.
- Only files uploaded directly through the **Mathesar UI** will show previews.

!!! tip "Working with multiple files per row"
  	You'll notice that each cell in a file column supports **only one file**. However, you can add as many different file columns to a row as you like.

  	For example, in an **Orders** table you might add:

    - an **Invoice** column for storing a PDF invoice
  	- a **Receipt Photo** column for storing one image of the receipt

  	If you need to store many, contextually-related files per record, use a relational database approach.

  	For instance, if each order should have many photos attached:

  	1. Create a separate table called **Order Photos** with a file column.
  	2. Add a foreign key from **Order Photos** back to **Orders**.
  	3. Now each order can have as many photos as you like, while still keeping your schema clean.

    In the future, we plan to improve on this workflow by making it easier to see columns across tables in the same view.

Files are stored internally as JSON objects with the following structure:

```json
{
  "uri": "s3://<bucket-name>/admin/20250919-192215167015/example.csv",
  "mash": "58f47a1eafd567cd9d0bdfa1f42a01978cc6f36eb7937b310b208d9957b7ee8b"
}
```

## Guide: Adding file columns

Adding a file column works just like adding any other column type in Mathesar:

1. Open the table where you want to add files.
2. Click **Add Column**.
3. Choose **File** as the column type.
4. Save your changes.

Once the file column is created, you’ll be able to upload files into it directly from the Mathesar UI.

!!! tip "Previews only for UI uploads"
    If files are added to the database outside of the Mathesar UI (e.g., via API or direct database manipulation), previews may not be available. Downloads will still work.

---

By default, Mathesar installations need to be connected to an object storage backend in order to support file uploads.
