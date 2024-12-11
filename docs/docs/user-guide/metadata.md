# Mathesar Metadata

Mathesar keeps as much of your data as possible inside your connected PostgreSQL database, structured consistently with the way it appears in the Mathesar interface. However, some of the customization that Mathesar offers doesn't fit neatly into the PostgreSQL model, so Mathesar stores a thin layer of metadata in its [internal database](./databases.md#internal) to support these features.

## Table metadata

For each table, the following optional configurations are stored as metadata:

- **Column order**

    Interestingly, PostgreSQL does not allow existing columns to be rearranged. Mathesar allows you to customize the column order by dragging and dropping columns in the table view. This order is stored as metadata. When no metadata is present, the columns will be displayed in the order they are stored in PostgreSQL.

- **Record summary template**

    The template used to generate [record summaries](./relationships.md#record-summaries). This allows links to records in the table to be summarized into short human-readable pieces of text.

    Without any metadata, the record summary will be generated using the first text-like column of the table if possible.

## Column metadata

Many of Mathesar's [data types](./data-types.md) have type-specific **formatting** options which are stored as metadata. These options allow you to customize the way the data is displayed in the Mathesar interface.

## Metadata access control

{% include 'snippets/metadata-access-control.md' %}
