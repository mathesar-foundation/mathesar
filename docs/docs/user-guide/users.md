# Users

Mathesar allows multiple users to collaborate on the same data using a [role-based permissioning](./permissions.md) system.

## Managing Users

1. Click on the gear icon on the top right of the application and select **Administration**.
1. In the left sidebar, click on **Users**.

!!! info "Admin-assigned passwords"
    Any user with an admin-assigned password (new or edited) will be prompted to change their password after logging in.

## Admin vs Standard users

Each Mathesar user is either **Admin** or **Standard**.

Admin users have the following capabilities which Standard users do not:

- Admins can can manage other Mathesar users (view, add, edit, delete).
- Admins can add and remove [Databases](./databases.md).
- Admins can manage [Collaborators](./permissions.md#collaborators). This allows an Admin user to grant any Mathesar user access to a database through a PostgreSQL role that the Admin specifies.

Upon installing Mathesar, your first user will be an Admin user.

## Users vs Roles

- A **"user"** is a Mathesar construct. Each Mathesar installation has multiple users.
- A **"role"** is a PostgreSQL construct ([docs](https://www.postgresql.org/docs/current/user-manag.html)). Each PostgreSQL server has multiple roles and multiple databases.

!!! caution "Why this distinction is important"
    Outside of Mathesar, it's not uncommon for people to say _user_ when referring to a PostgreSQL _role_. However, within the context of Mathesar users and roles are different things! Our documentation maintains this distinction pedantically.

How users and roles work together:

- To access a database, each Mathesar user must be assigned a PostgreSQL role to be used for that database.
- The user's permissions on anything _inside_ the database are determined by the corresponding role's permissions within PostgreSQL.

    !!! info "Admin doesn't matter here"
        The user's "admin" status with Mathesar _has no effect_ on the user's ability to do things within a database! It only affects operations outside the database. This includes configuring database roles and managing collaborators, even though those operations are presented within the Database section of the UI they are considered to be _outside_ the database.

- You can configure separate Mathesar users to share the same PostgreSQL role if you like. This is a good option if you want those users to have the same permissions on the data.
- Or you can use separate PostgreSQL roles for different users. This is necessary any time you want different users to have different permissions on the data.
- You cannot configure one Mathesar user with two PostgreSQL role simultaneously — though you can save multiple PostgreSQL roles in Mathesar and manually switch between them if necessary.

See [Permissions](./permissions.md) for more information on managing roles.

## Limitations

- Mathesar does not send invitation emails to new users (yet). You'll need to send the user their username and password yourself.
- Nor is there yet an email-based password recovery mechanism. If you are locked out of your Mathesar installation's web interface, your system administrator can still [use the command line reset any user's password](https://stackoverflow.com/questions/6358030/how-to-reset-django-admin-password).
