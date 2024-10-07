# Mathesar's Role-Based Permissions

Mathesar uses [PostgreSQL roles](https://www.postgresql.org/docs/current/user-manag.html) to manage permissions within a database. These roles define the actions users can perform, allowing fine-grained control over access.

## Roles vs Users

Each Mathesar user accesses a database through one PostgreSQL role — and the user's permissions are determined by the _role's_ permissions within PostgreSQL.

You can read more about [how users and roles work together](./users.md#users-vs-roles).

## Database Settings

Mathesar provides three main sections for role management within the database settings:

### In Mathesar

These configurations specifically control how you interact with the database within the Mathesar interface.

- **Role Configuration**: Used to manage credentials (passwords) for roles that exist on the server. These roles can then be assigned to collaborators.
- **Collaborators**: This section enables you to manage user access to the database. You can add existing Mathesar users as collaborators and assign them configured roles, which determine their specific access levels and permissions within the database.

### On the Server

These configurations affect the underlying PostgreSQL server where your database lives. Changes to these configurations will be reflected in all databases on the server.

- **Roles**: Here you can manage roles available on the server, defining their inheritance, creating new roles, or deleting existing ones.

### Role Configuration

In the **Role Configuration** section, all [LOGIN roles](https://www.postgresql.org/docs/current/role-attributes.html#ROLE-ATTRIBUTES) that exist on the server are listed. These roles can then be assigned to collaborators once configured. A configured role has a password set.

- **Password Management**: For each role, you can configure or change the password directly within Mathesar.
- **Remove Role Configuration**: You can remove role configurations from Mathesar as needed. This only removes the credentials, not the role from the server.

### Collaborators

Collaborators are users who have been added to work on a database. Each collaborator is assigned a PostgreSQL LOGIN role that dictates their level of access to the database and its objects (schemas, tables, etc.).

- **Add Collaborators**: In the **Collaborators** section, you can add new users as collaborators to the database. When adding a collaborator, you assign them one of the roles that have been configured in Mathesar.

- **Remove Collaborators**: You can remove collaborators if they no longer require access to the database. The Mathesar user will still exist and you can add them back as a collaborator at a later time.

### Server Roles

The **Server Roles** section, found under the **Settings** tab, shows the roles available on the server for the current database.

These roles will be displayed for all databases on the server. Also, any changes made to a server role will be reflected in all databases on the server.

- **Create Roles**: You can create new server-level roles from this section. You can configure these roles in two ways:
    1. With login capability and a password, which you can assign to collaborators.
    2. Without login capability, to be used as a parent role exclusively. You cannot assign these roles to collaborators directly.
- **Define Child Roles**: PostgreSQL has a mechanism for [Role Membership](https://www.postgresql.org/docs/current/role-membership.html) wherein any role can be "granted" to any other role to form simple hierarchies or complex graph-based inheritance structures. For any role you've configured within Mathesar, you can use Mathesar to grant the role to other "child roles".
- **Drop Roles**: You can drop server-level roles that are no longer needed. This action removes the role from the server and all databases where it has been assigned. Exercise caution when dropping roles, as it may affect existing permissions and user access across multiple databases.

!!! note
    Server roles, once added, must be configured in Mathesar under the **Role Configuration** section before they can be assigned to collaborators.

---

## Permissions Management at Different Levels

Mathesar manages permissions at three levels:

1. **Database Level:** Managed from the database page.
2. **Schema Level:** Managed from the schema page.
3. **Table Level:** Managed from the inspector panel for each table.

### Ownership of Objects

Owners of each object (database, schema, or table) can set permissions for other users. Ownership is determined by the user's assigned collaborator role in the database.

When a new object (database, schema, or table) is created, the owner of the object is the collaborator who created it. This automatic ownership assignment allows the creator to have immediate and full control over the objects they create, including the ability to manage permissions and transfer ownership if needed.

### Database Permissions

Database permissions control access and actions at the database level.

- **Owner**: Each database has an owner who has full control over the database, including managing permissions and transferring ownership.
- **Granted Access**: Specific permissions can be granted to roles for various actions within the database.
- **Transfer Ownership**: The current owner can transfer ownership to another role, granting them full administrative control.

For each database, the following permission levels can be granted:

- **Connect**: Allows the role to access and connect to the database.
- **Create**: Includes Connect permissions and allows the role to create new schemas within the database.
- **Custom**: Enables the granular setting of permissions beyond the predefined options.

### Schema Permissions

Schema permissions control access and actions at the schema level.

- **Owner**: Each schema has an owner who has full control over the schema, including managing permissions and transferring ownership.
- **Granted Access**: Specific permissions can be granted to roles for various actions within the schema.
- **Transfer Ownership**: The current owner can transfer ownership to another role, granting them full administrative control over the schema.

For each schema, the following permission levels can be granted:

- **Read**: Allows the role to access the schema and view its objects.
- **Create**: Includes Read permissions and allows the role to create new tables within the schema.
- **Custom**: Enables the granular setting of permissions beyond the predefined options.

### Table Permissions

Table permissions control access and actions at the table level.

- **Owner**: Each table has an owner who has full control over the table, including managing permissions, transferring ownership, and modifying the table's structure (such as adding, removing, or altering columns).
- **Granted Access**: Specific permissions can be granted to roles for various actions on the table.
- **Transfer Ownership**: The current owner can transfer ownership to another role, granting them full administrative control over the table.

For each table, the following permission levels can be granted:

- **Read**: Allows the role to access the table and read records.
- **Write**: Includes Read permissions and allows the role to insert, update, and delete records in the table.
- **Custom**: Enables the granular setting of permissions beyond the predefined options.
