# Working with files in Mathesar

!!! question "Help us refine files!"
    Our file column feature is new and still evolving. We would like to support a wide variety of backends, storage formats, and use cases in the future.

	We'd love to hear about how you're using files, what's working, and what additional workflows you'd like to see supported. If you [schedule a call with us for 20 min](https://cal.com/mathesar/users), we'll give you a $25 gift card as a thank you!

Mathesar's **file data type** allows you to attach and interact with files directly in Mathesar, making it easy to store and preview files alongside your structured data.

- All file types are supported.
- Image files display a **thumbnail preview**, which can be clicked to preview a larger version.
- Non-images display an icon which can be clicked to view file metadata.
- All files can be **downloaded or removed** from a row.

## Enabling the file data type

To enable files in Mathesar, see our guide for how to [configure a file storage backend](../administration/file-backend-config.md). At present, Mathesar _only_ supports storing files on an **S3-compatible object storage backend**.

Once you have configured a backend, users with edit permissions on a table can add file columns to tables and begin uploading files.

## Adding file columns

![Adding a "Employment Contract" file column to a "Mechanics" table](../assets/images/files/add-column.png)
/// caption
A bike shop owner adding an "Employment Contract" column to their "Mechanics" table.
///

Adding a file column works just like adding any other column type in Mathesar:

1. Open the table where you want to add files.
1. Click the "+" icon **Add Column**.
1. Choose **File** as the column type and name the column.
1. Save your changes.

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

    In the future, we plan to assist users in cleaning up these "orphaned" files.

## Associating multiple files with a row

Each **file column** can hold only **one file per cell**. However, you can add multiple file columns to a single row if you need to attach different types of files.

If you expect a row to reference a large or variable number of files—where creating a separate column for each one would be cumbersome—consider using database relationships instead. This lets you associate many files with a single record in a structured way.

For example, consider an **Orders** table with a few image columns:

- an **Invoice** column for storing a PDF invoice
- a **Delivery Photo** column for storing one image of the shipped order

If each order needs to include **many related files**, for example multiple order photos, a relational approach is more flexible:

1. Create a new table called **Order Photos** with a file column.
2. Add a foreign key from **Order Photos** back to **Orders**.
3. Each order can now have as many photos as needed while keeping the schema clean.

In the future, we plan to enhance this workflow by making it easier to view related columns across tables in a single interface.
