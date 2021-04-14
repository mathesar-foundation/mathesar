Roadmap
=======

This is the Mathesar roadmap for the next few months until we get to a mininum viable product. Each section represents a conceptual grouping of features. 

We have many more features planned for Mathesar, some of them are quite essential. See :doc:`Future Features <future>`.

.. warning:: We are still finalizing the roadmap and it is expected to change significantly over the next few weeks. This notice will be removed when the roadmap is more stable.

.. contents:: :local:

Installation and Configuration
------------------------------
Users should be able to:

- Follow provided instructions to install Mathesar on a server.

  - The installation process should only install PostgreSQL if needed.
- Access existing PostgreSQL databases via Mathesar using existing PostgreSQL user credentials.

  - Existing databases should reflect all columns and types correctly in the user interface.
- Set up a PostgreSQL server automatically if none exists.
- Create a new database from scratch.
- Create an initial user if needed.
- Configure sending email (for password resets, notifications)

User Settings
-------------
Users should be able to:

- Configure Mathesar to display databases in either technical or non-technical mode.

  - "Technical mode" is going to use PostgreSQL terms for everything (e.g. schemas are schemas, not applications)

CRUD For Tables & Schemas
-------------------------
Users should be able to perform these actions in both the GUI and API:

- Create a new table

  - in an existing schema
  - in a new schema
- Create a table via importing data via
   - CSV
   - TSV
   - copy/paste from a spreadsheet
- View a table and see what type each column is.
- Edit a table name
- Edit a schema name
- Edit the data in their table using a spreadsheet-like interface

  - e.g. fill down cells by dragging a corner
- Delete a table
- Delete a schema

At this point, all columns are displayed and edited as strings. We will support reflecting types from the database, but we're not going to be doing anything with those types yet.

Filtering, Sorting, Grouping
----------------------------
Users should be able to perform these actions in both the GUI and API:

- Filter the table by rules applied to data in various fields.
- Sort the table by various fields.
- Group results by the first character of any given field.
- Group results by the first word of any given field.
- Apply multiple filters, groups, and/or sorts at once.

Multiple Types Support
----------------------
Users should be able to perform these actions in both the GUI and API:

- Change the type of data per-column to any type supported by Postgres or PostGIS

  - The data in the column will be validated.
- Import data via any supported import method and have the types of data automatically detected during the import process

  - Types are suggestions and can be changed by the user.

Boolean Type
------------
- Add new type (use Postgres type if possible):

  - Boolean
- Autodetect this type during import
- Allow user to change columns to this type
- Add additional grouping options by value (yes/no)

New Text Types
--------------
- Add new types:

  - Email
  - URL
- Autodetect these types during import
- Allow user to change columns to these types
- Add additional grouping options:

  - Email: Domain
  - URL: TLD, Protocol

Numeric Types
-------------
- Add new types, using existing Postgres types where possible:

  - Money (with specified currency)
  - Percentage
  - Number
- Autodetect these types during import
- Allow user to change columns to these types
- Add additional grouping options:

  - Number: Range (calculate range options dynamically based on data, e.g. if data varies from 1-100, ranges could be 1-10, 10-20, etc.)

  - Money: Range, Currency
  - Percentage: Range

Date and Time Types
-------------------
- Add new types, using existing Postgres types where possible:

  - Date & Time
  - Date
  - Time
  - Duration
- Autodetect these types during import
- Allow user to change columns to these types
- Add additional grouping options:

  - Date & Time, Date, Time support all grouping options supported by Postgres EXTRACT function.
  - Duration: Range
- Allow filtering using natural language for dates (e.g. "next month")

Location Type
-------------
- Add new type, using existing PostGIS type where possible:

  - Location
- Autodetect this type during import
- Allow user to change columns to this type
- Add additional grouping options:

  - Street Address
  - Country
  - Administrative Area Level 1 *(in the US, these are states)*
  - Administrative Area Level 2 *(in the US, these are counties)*
  - Administrative Area Level 3
  - Administrative Area Level 4
  - Administrative Area Level 5 
  - Locality *(city/town)*
  - Sublocality *(subdivision of city/town)*
  - Neighborhood
  - Postal Code
  - Latitude
  - Longitude

The attributes of the location column type are based on results returned by the `Google Maps Geocoding API <https://developers.google.com/maps/documentation/geocoding/overview>`_, since they've done the work of putting addresses into a global format.

Phone Number Type
-----------------
- Add new type
 
  - Phone Number
- Autodetect this type during import
- Allow user to change columns to this type
- Add grouping options:

  - Country Code
  - Area Code

Relationship Type
-----------------
Users should be able to:

- Create a column that represents a relationship to another record (e.g. Book --> Author)
- "Extract" a column from a table into a separate table (change the underlying schemas)
- Choose which field from the other table to use to represent the relationship (e.g. if I'm displaying the Author in the Book table, I want to see the Author's name, not ID)

Views
-----
Users should be able to:

- Save filtered/sorted/grouped tables as views.
- Create a calendar view based on date and time fields in their data 
- Create a map view based on locations in their data
- Create a histogram chart view based on their data
- Create a pie chart view based on their data
- Create a line graph view based on their data
- Create a scatter plot view based on their data
- View all saved views and switch between views
- Set a default view for a table/schema
- Delete a view
- Rename a view

Computed Data
-------------
Users should be able to:

- Create a new column that computes data from other columns using forumulas.
- Create "subtotals" for grouped views

  - Support different types of subtotals: SUM, AVG, MIN, MAX, MED
- Create summary views based on subtotals, and use that data in views

  - e.g. given a database of sales with dates, create a summary view of sales per quarter and put that into a histogram

User Management
---------------
Users should be able to:

- Log in
- Log out
- Create a new user with permissions: admin, editor, viewer
- Change a user's permissions
- Reset a user's password
- Reset their own password (if email is enabled)

Collaboration
-------------
- Users should be able to share tables, schemas, and/or views with either:
   - the general public (no sign in required)
   - all signed in users
   - specific users
- Each of these should support:
  - admin, view, edit permissions
- Existing postgres permissions should be respected/reflected

Data Workflow Improvements
--------------------------
Users should be able to:

- Search for data across various tables and schemas
- Bulk edit data
- Bulk import new data into an existing collection
- Export data to:

  - SQL
  - CSV
  - TSV
  - JSON
  - Excel
  - XML
