# File columns in Mathesar

!!! question "Help us refine files!"
    Our file column feature is new and still evolving. We would like to support a wide variety of backends, storage formats, and use cases in the future.
	
	We'd love to hear about how you're using files, what's working, and what additional workflows you'd like to see supported. If you [schedule a call with us for 20 min](https://cal.com/mathesar/users), we'll give you a $25 gift card as a thank you!

Mathesar supports **file columns** which allow you to attach and interact with files of any type. These columns make it easy to store and preview files alongside your structured data.

- All file types are supported.
- Image files display a **thumbnail preview**, which can be clicked to view a larger version.
- All files can be **downloaded or removed** from a row.

## Enabling file columns

To enable file columns in Mathesar, see our guide for how to [configure a file storage backend](../administration/file-backend-config.md). At present, Mathesar _only_ supports storing files on an **S3-compatible object storage backend**.

Once you have configured a backend, users with edit permissions on a table can add a file column and begin uploading files.

## Adding file columns

![Adding a "Employment Contract" file column to a "Mechanics" table](../assets/images/files/add-column.png)
/// caption
A bike shop owner adding an "Employment Contract" column to their "Mechanics" table.
///

Adding a file column works just like adding any other column type in Mathesar:

1. Open the table where you want to add files.
2. Click the "+" icon **Add Column**.
3. Choose **File** as the column type and name the column.
4. Save your changes.

Once the file column is created, you’ll be able to upload files into it directly from the Mathesar UI.

## Uploading files

To upload a file into a file cell, click the cell's "+" icon and upload an image using the file upload dialog:

![Mathesar's file upload dialog](../assets/images/files/upload-dialog.png)

## Viewing files

Once uploaded, you'll now see a preview of your file in the cell:

**For image files**, Mathesar will show a thumbnail preview which can be clicked to view a larger preview in a lightbox:

![alt text](../assets/images/files/image-lightbox.png)

**For all other files**, Mathesar will display a file icon which can be clicked to show the file path and other details:

![alt text](../assets/images/files/non-image-popup.png)

## Removing files

To **remove** a file from a cell, click the "remove" button in either the image lightbox or the file popup.

!!! warning "Removed files are not deleted from the backend"
    Files that are _removed_ from a cell in Mathesar are **not deleted from the file backend**. Only the reference to the file is deleted from the cell.

    In the future, we plan to develop tooling to help users clean up these "orphaned" files.

## Tips and technical information

### Working with multiple files per row

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

### How files are stored

Files are stored in your PostgreSQL database in `JSONB` columns. A typical file value looks like this:

```json
{
  "uri": "s3://my-mathesar-bucket/my-username/20250919-192215167015/example.csv",
  "mash": "58f47a1eafd567cd9d0bdfa1f42a01978cc6f36eb7937b310b208d9957b7ee8b"
}
```

With the `uri` being the path to the file on the storage backend and the mash being a generated, unique value used by Mathesar.

### Removing file backends

If you remove a file backend, you'll no longer see the "File" option in the add column dropdown. Existing file data will be preserved in your database, but in Mathesar's UI you'll see the underlying JSONB instead of image thumbnails or file icons.

### Forms compatibility

Files do not yet work with Mathesar's form builder. We plan to add support for anonymous file uploads via forms, with restrictions around file type and size to keep your Mathesar installation secure.
