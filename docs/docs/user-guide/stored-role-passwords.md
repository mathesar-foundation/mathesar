# Stored Role Passwords

Mathesar stores passwords for any [roles](./roles.md) that you would like to use when authenticating with PostgreSQL to work with data. Roles with stored passwords can then be assigned to [users](./users.md) via [collaborators](./collaborators.md)

When you connect a database for the first time, the password for the role you specify is stored in Mathesar, and a collaborator for your user is established for the database. However for any additional roles you create, you'll need to manually save the password in Mathesar.

After being saved, the stored passwords are not available to be viewed again within Mathesar.

If the password for a role is modified within PostgreSQL, you'll need to update the stored password for that role in Mathesar.

How passwords are stored:

- Passwords are stored in Mathesar's [internal database](./databases.md#internal).
- They are encrypted at rest with your [SECRET_KEY](../administration/configuration.md#secret_key) generated at installation time.
- They are stored per-database-_server_. This means that if you connect two databases on the same server, then the same role password can be used for both databases.

To manage the stored passwords:

1. Navigate to the page for your connected database.
1. Go to the **Database Settings** tab.
1. Click on **Stored Role Passwords** in the left-hand menu.
