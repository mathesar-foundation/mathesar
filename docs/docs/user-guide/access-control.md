# Overview of Access Control in Mathesar

To manage access to data, Mathesar utilizes PostgreSQL's powerful role-based permissions system. Each user accesses a database through a specific PostgreSQL role, and the user's access is determined by the role's privileges within PostgreSQL.

Here's how it works:

1. **[Mathesar Users](./users.md):** Everyone using Mathesar gets their own personal user account and has control over their password and username. [Admin](./users.md#admin) users have some additional privileges, but only for high-level Mathesar-specific operations like connecting databases and managing other users.

1. **[PostgreSQL roles](./roles.md):** Within PostgreSQL, privileges on data can be granted to different roles at a granular level. Mathesar respects these privileges and also exposes functionality for you to see and modify them.

1. **[Stored Role Passwords](./stored-role-passwords.md):** Mathesar stores the passwords for any roles that you would like to use to authenticate with PostgreSQL.

1. **[Collaborators](./collaborators.md):** For a user to access a given database, an [admin](./users.md#admin) must add the user as a collaborator on that database and assign the user to a specific PostgreSQL role. You can configure separate Mathesar users to share the same PostgreSQL role if you like. Or you can use dedicated PostgreSQL roles for different users.

{% include 'snippets/metadata-access-control.md' %}

