# Users & Access Levels

Mathesar allows you to set up users with different access levels. A user's access levels determine what they can do with the data managed in Mathesar.

Mathesar's installation process includes setting up the first user. This user is an **Admin**.

## Managing Users

1. Click on the gear icon on the top right of the application and select **Administration**.
2. In the left sidebar, click on **Users**.

!!! note
    - Only **Admins** can add new users.
    - Mathesar does not send invitation emails to new users (yet). You'll need to send the user their username and password yourself.
    - The user will be prompted to change the password when they log in for the first time.

## User Types

Users can be either **Admin** or **Standard** users.

### Admin users

Admin users:

- can manage other users (view, add, edit, delete)
- have **Manager** permissions on all databases and schemas

You cannot set granular permissions for an **Admin** user.

### Standard users

By default, **Standard** users cannot see anything in Mathesar. They will need to be granted database or schema roles individually.

## Database Roles

There are three levels of database roles:

- **Managers** own the database. They can edit all data in the database, as well as edit the structure of data (e.g. create tables, add and remove columns, etc.). They also manage access to the database.
- **Editors** can edit all data in the database, but cannot change the underlying data structures or manage access.
- **Viewers** have read-only access to all data in the database. They cannot make any changes.

### Manager

- Receives **Manager** permissions on all schemas in the database.
- Can view, add, and remove other users' access to the database.
- Can view, add, edit, and remove any schema in the database.
- Can view, add, edit, and remove any table in the database.
- Can view, add, edit, and remove any column in the database.
- Can view, add, edit, and remove any constraint in the database.
- Can view, add, edit, and remove any record in the database.
- Can perform "extract column" and "move column" actions

### Editor

- Receives **Editor** permissions on all schemas in the database.
- Can view any schema in the database.
- Can view any table in the database.
- Can view any column in the database.
- Can view any constraint in the database.
- Can view, add, edit, and remove any record in the database.

### Viewer

- Receives **Viewer** permissions on all schemas in the database.
- Can view any schema in the database.
- Can view any table in the database.
- Can view any column in the database.
- Can view any constraint in the database.

## Managing Database Roles

!!! note
    - Only **Admins** and **Database Managers** can manage access to a database.

1. Click on the Mathesar logo on the top left of the application to go to the database page.
2. Click on the **Manage Access** button.

## Schema Roles

There are three levels of schema roles:

- **Managers** own the schema. They can edit all data in the schema, as well as edit the structure of data (e.g. create tables, add and remove columns, etc.). They also manage access to the schema.
- **Editors** can edit all data in the schema, but cannot change the underlying data structures or manage access.
- **Viewers** have read-only access to all data in the schema. They cannot make any changes.

### Manager

- Can view, add, and remove other users' access to the schema.
- Can view, add, edit, and remove any schema in the schema.
- Can view, add, edit, and remove any table in the schema.
- Can view, add, edit, and remove any column in the schema.
- Can view, add, edit, and remove any constraint in the schema.
- Can view, add, edit, and remove any record in the schema.
- Can perform "extract column" and "move column" actions

### Editor

- Can view any table in the schema.
- Can view any column in the schema.
- Can view any constraint in the schema.
- Can view, add, edit, and remove any record in the schema.

### Viewer

- Can view any table in the schema.
- Can view any column in the schema.
- Can view any constraint in the schema.

## Managing Schema Roles

!!! note
    - Only **Admins**, **Database Managers**, and **Schema Managers** can manage access to a schema.

1. Click on the Mathesar logo on the top left of the application to go to the database page.
2. Select the appropriate schema from the list to navigate to the schema's homepage.
3. Click on the **Manage Access** button.

## Order of Precedence

!!! warning 
    - The Mathesar UI currently has an issue where **schema roles** _always_ take precedence over **database roles**. This behavior will is not in line with the API and will be fixed in a future release.

If a user has both a **Database Role** and a **Schema Role** for a schema within the same database, the **Schema Role** will only have an effect if it grants more permissions.

Examples:

- If a user is a **Database Manager** but has **Viewer** permissions on a given schema, the schema role has no effect.
- If a user is a **Database Editor** but has **Manager** permissions on a given schema, the schema role will take precedence.
