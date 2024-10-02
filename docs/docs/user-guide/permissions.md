# Mathesar's Role-Based Permissions

Mathesar uses PostgreSQL roles to manage permissions at the database, schema, and table levels. These roles define the actions users can perform, allowing fine-grained control over access.

## Database Settings

Mathesar provides three main sections for role management within the database settings:

- **Role Configuration**: Used to manage credentials (passwords) for roles that exist on the server. These roles can then be assigned to collaborators.
- **Collaborators**: This section allows you to add users and assign them configured roles, dictating their access levels within the database.
- **Server Roles**: Here you can manage roles available on the server itself, defining inheritance, creating new roles, or deleting existing ones.

> **Note:** Role Configuration is Mathesar-specific, managing credentials for existing roles within a connected database. Server Roles, however, exist on the PostgreSQL server itself and affect all databases.

### Role Configuration

In the **Role Configuration** section, all LOGIN roles that exist on the server are listed. These roles can then be assigned to collaborators once configured. A configured role has a password set.

- **Password Management**: For each role, you can configure or change the password directly within Mathesar.
- **Remove Role Configuration**: Role configurations can be removed from the database as necessary. This only removes the credentials, not the role from the server.

### Collaborators

Collaborators are users who have been added to work on the database. Each collaborator is assigned a PostgreSQL LOGIN role that dictates their level of access to the database and its objects (schemas, tables, etc.).

- **Add Collaborators**: In the **Collaborators** section, you can add new users as collaborators to the database. When adding a collaborator, you assign them one of the roles that have been configured in Mathesar.

- **Remove Collaborators**: Collaborators can be removed if they no longer require access to the database. The Mathesar user will still exist and can be added back as a collaborator at a later time.

### Server Roles

The **Server Roles** section, found under the **Settings** tab, shows the roles available on the server for the current database.

These roles will be displayed for all databases on the server. Also, any changes made to a server role will be reflected in all databases on the server.

- **Create Roles**: New server-level roles can be created here. These roles can be configured in two ways:
  1. With login capability and a password, which can be assigned to collaborators.
  2. Without login capability, it is to be used as a parent role exclusively. These roles cannot be assigned to collaborators directly.
- **Define Child Roles**: For existing server-level roles, you can specify which other roles should be their child roles. This allows for creating hierarchies of roles where permissions can be inherited from parent to child roles.
- **Drop Roles**: Server-level roles that are no longer needed can be dropped. This action removes the role from the server and all databases where it has been assigned. Exercise caution when dropping roles, as it may affect existing permissions and user access across multiple databases.

> **Note:** Server roles, once added, must be configured in Mathesar under the **Role Configuration** section before they can be assigned to collaborators.

---

## Permissions Management at Different Levels

Mathesar manages permissions at three levels:

1. **Database**
2. **Schema**
3. **Table**

Owners of each object (database, schema, or table) can set permissions for other users. Ownership is determined by the user's assigned collaborator role in the database.

### Ownership of New Objects

When a new object (database, schema, or table) is created, the owner of the object is the collaborator who created it. This automatic ownership assignment allows the creator to have immediate and full control over the objects they create, including the ability to manage permissions and transfer ownership if needed.

You can find and manage permissions in the following sections:

- **Database Permissions**: On the database settings page.
- **Schema Permissions**: On each schema's page.
- **Table Permissions**: In each table's inspector panel.

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
