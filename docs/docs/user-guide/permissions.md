# Mathesar's Role-Based Permissions

Mathesar uses [PostgreSQL roles](https://www.postgresql.org/docs/current/user-manag.html) to manage permissions on your data. These roles define the actions users can perform, allowing fine-grained control over access.

## Roles vs Users

Each Mathesar user accesses a database through one PostgreSQL role — and the user's permissions are determined by the _role's_ permissions within PostgreSQL.

You can read more about [how users and roles work together](./users.md#users-vs-roles).

## The Database "Settings" tab {:#database_settings}

Each database has its own page within Mathesar. And on that page you'll find a "Settings" tab where you can manage roles and collaborators.

### _In Mathesar:_ Role Configuration {:#role_configuration}

Use this section to manage the credentials (i.e. passwords) for roles that you'd like to assign to collaborators within Mathesar. Mathesar will display all [LOGIN roles](https://www.postgresql.org/docs/current/role-attributes.html#ROLE-ATTRIBUTES) that exist on the server.

- Click **Configure in Mathesar** to store the role's password in Mathesar and allow the role to be associated with collaborators.

- Click **Configure Password** to update the password of an already configured role.

- Click **Remove** to remove Mathesar's stored password for a role. The role will remain on the server.


### _In Mathesar:_ Collaborators {:#collaborators}

A "collaborator" is a Mathesar user who has access to a database through a specific PostgreSQL role.

The Collaborators section allows you to add and remove collaborators and edit their corresponding PostgreSQL roles.

!!! tip "Keep in mind"

    - You'll only be able to choose roles that have been "configured" in the above section — roles for which Mathesar has passwords stored.

    - Removing a collaborator revokes that user's access to the database _but_:

        - If the user is a Mathesar [admin](./users.md#admin-vs-standard-users), they'll be able to gain access again.
        - The user will still remain in Mathesar, potentially with access to other Databases.
        - The role (and it's corresponding password) will still remain configured in Mathesar.
        - The role will still remain on the PostgreSQL server.

### _On the Server:_ Roles {:#roles}

Here you can manage roles available on the server, defining their inheritance, creating new roles, or deleting existing ones. Any changes here will be reflected for all connected databases which share this server.

- **Create Roles**: You can create new server-level roles from this section. You can configure these roles in two ways:
    1. With login capability and a password, which you can assign to collaborators.
    2. Without login capability, to be used exclusively as a parent role to group permissions that can be inherited by other roles. You cannot assign these non-login roles to collaborators directly.
- **Define Child Roles**: PostgreSQL has a mechanism for [Role Membership](https://www.postgresql.org/docs/current/role-membership.html) wherein any role can be "granted" to any other role to form simple hierarchies or complex graph-based inheritance structures. For any role you've configured within Mathesar, you can use Mathesar to grant the role to other "child roles".
- **Drop Roles**: You can drop server-level roles that are no longer needed. This action removes the role from the server, however if the role is configured in Mathesar, it will still be displayed. Exercise caution when dropping roles, as it may affect collaborators using the dropped role in Mathesar.

!!! note
    Server roles, once added, must be configured in Mathesar under the **Role Configuration** section before they can be assigned to collaborators.

---

## PostgreSQL objects {:#objects}

In PostgreSQL, an "object" is a thing like: a database, a schema, a table, _(and some other things too, which we won't cover here)_.

### Privileges and ownership

- **Privileges:** Specific privileges on an object can be granted to specific roles.

    !!! example
        A role can be granted the `CREATE` privilege on a schema. This allows the role to create new tables within the schema.

- **Ownership**: Every PostgreSQL object has one and only one role said to be its "owner". The owner generally can do anything directly to the object, but not necessarily other objects contained within it. By default the owner is set to the role which created the object.

- **Shared ownership:** While PostgreSQL has a variety of granular privileges for different actions, there are still certain actions which remain restricted to object owners. For example only the owner of a table can add new columns to it.

    While this behavior may seem limiting, it's still possible configure multiple roles to effectively "own" a single object by leveraging PostgreSQL's powerful role inheritance functionality:
    
    1. We can create a third role to directly own the object and act as a sort of proxy "group". (The group role doesn't need to be a `LOGIN` role and thus doesn't require a password to be configured.)
    1. Then we can grant _that group role_ to any other roles we'd like.
    1. Those child roles will then have permission do things _as if they were the owner themselves_.
    
    You can use the Mathesar UI to configure an arrangement like the above, though it will require many steps.

### Database Permissions

The "Database Permissions" modal is accessible via a button at the top right of the database page and allows you to configure the owner and granted privileges for a database.

- **Owner**: Each database has an owner who has administrative control over the database itself, including managing database-level permissions and transferring ownership. Ownership does not automatically extend to the objects within the database (such as schemas and tables), which may have their own separate ownership and permission settings.
- **Granted Access**: Specific permissions can be granted to roles for various actions within the database.
- **Transfer Ownership**: The current owner can transfer ownership to another role, granting them administrative control.

For each database, the following permission levels can be granted:

- **Connect**: Allows the role to access and connect to the database.
- **Create**: Includes Connect permissions and allows the role to create new schemas within the database.
- **Custom**: Enables the granular setting of permissions beyond the predefined options.

### Schema Permissions

The "Schema Permissions" modal is accessible via a button at the top right of the schema page and allows you to configure the owner and granted privileges for a schema.

- **Owner**: Each schema has an owner who has administrative control over the schema itself, including managing schema-level permissions and transferring ownership. Ownership does not automatically extend to the objects within the schema (such as tables), which may have their own separate ownership and permission settings.
- **Granted Access**: Specific permissions can be granted to roles for various actions within the schema.
- **Transfer Ownership**: The current owner can transfer ownership to another role, granting them administrative control over the schema.

For each schema, the following permission levels can be granted:

- **Read**: Allows the role to access the schema and view its objects.
- **Create**: Includes Read permissions and allows the role to create new tables within the schema.
- **Custom**: Enables the granular setting of permissions beyond the predefined options.

### Table Permissions

The Table Permissions modal is accessible via a button from within the right-side inspector panel for each table and allows you to configure the owner and granted privileges for a table.

- **Owner**: Each table has an owner who has administrative control over the table itself, including managing table-level permissions, transferring ownership, and modifying the table's structure (such as adding, removing, or altering columns).
- **Granted Access**: Specific permissions can be granted to roles for various actions on the table.
- **Transfer Ownership**: The current owner can transfer ownership to another role, granting them administrative control over the table.

For each table, the following permission levels can be granted:

- **Read**: Allows the role to access the table and read records.
- **Write**: Includes Read permissions and allows the role to insert, update, and delete records in the table.
- **Custom**: Enables the granular setting of permissions beyond the predefined options.

You can read more about the specific privileges that can be granted in the [PostgreSQL documentation on Privileges](https://www.postgresql.org/docs/current/ddl-priv.html).
