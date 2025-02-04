# Collaborators

For every [database](./databases.md) you connect in Mathesar, you can manage the access that your Mathesar [users](./users.md) have to that database by adding them as collaborators. Each collaborator is associated with a PostgreSQL [role](./roles.md) that determines their access to data.

Only [Mathesar admin users](./users.md#admin) can manage collaborators.

When you add a new database connection to Mathesar, your Mathesar user will automatically be added as a collaborator using the PostgreSQL role you specify at connection time.

Note that with collaborators, a user's role is set _per-database_. This means that one Mathesar user can be configured to use different PostgreSQL roles for different databases on the same server.

## Adding a collaborator

!!! info "Prerequisites"
    Before you can add a new collaborator:

    - Your [database](./databases.md) must be connected already
    - The [user](./users.md) must already exist in Mathesar
    - The [role](./roles.md) must already exist in PostgreSQL (you can [use Mathesar](./roles.md#managing))
    - A password must be [stored](./stored-role-passwords.md) for the role

1. Navigate to the page for your connected database.
1. Click on the **Database Settings** tab.
1. Click on **Collaborators** in the left-hand menu.
1. Click **Add Collaborator**.

## Removing a collaborator

Removing a collaborator revokes that user's access to the database _but_:

- If the user is a Mathesar [admin](./users.md#admin), they'll be able to gain access again by adding their user back as a collaborator.
- The user will still remain in Mathesar, potentially with access to other Databases.
- The role (and its corresponding password) will still remain configured in Mathesar.
- The role will still remain on the PostgreSQL server.

## Configuration patterns

- You can configure separate Mathesar users to share the same PostgreSQL role if you like. This is a good option if you want those users to have the same permissions on the data.
- Or you can use separate PostgreSQL roles for different users. This is necessary any time you want different users to have different permissions on the data.
- You cannot configure one Mathesar user with two PostgreSQL role simultaneously — though you can save multiple PostgreSQL roles in Mathesar and manually switch between them if necessary. You won't even need to enter the role's password each time you switch, since it will be saved in Mathesar.


