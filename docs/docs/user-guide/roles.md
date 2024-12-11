# PostgreSQL Roles

PostgreSQL uses roles to manage access to data, and each PostgreSQL server has many roles within it.

## What is a role

PostgreSQL role system is elegant and powerful, albeit somewhat idiosyncratic.

Many permissioning systems utilize the concept of "users" to control access, and PostgreSQL roles work in much the same way. You connect to a PostgreSQL server by supplying your role's name and password. Then your role will dictate your access throughout the server.

Other permissioning systems also commonly have a _separate_ concept of "groups", wherein multiple users can be members of a single group, and permissions can be granted to the group as a whole. Interestingly, PostgreSQL roles can _also_ function as groups! Through [role inheritance](#inheritance), any role can be granted to any other role.

!!! warning "Users vs Roles"
    Outside of Mathesar, it’s not uncommon for people to say _user_ when referring to a PostgreSQL _role_. However, within the context of Mathesar, users and roles are different things! Our documentation maintains this distinction pedantically. When we say "user", we mean a _Mathesar_ user, and when we say "role", we mean a _PostgreSQL_ role.

## Managing your PostgreSQL roles from within Mathesar {:#managing}

To see the roles available on your server, navigate to the **Database Settings** tab within the page for one of your connected databases. From there, you'll be able to add roles, drop roles, and edit role inheritance.

Role passwords are stored in Mathesar's [internal database](./databases.md#internal) and encrypted with your [SECRET_KEY](../administration/configuration.md#secret_key).

Renaming roles and modifying role properties (e.g. `LOGIN` status) is not supported within Mathesar.

## LOGIN vs non-LOGIN roles {:#login}

In PostgreSQL every role has a boolean `LOGIN` property which is either _true_ or _false_. A `LOGIN` role may have an associated password and thus be used to connect to the server; while a non-`LOGIN` role may not. Non-`LOGIN` roles are often used as "group" roles to be granted to other roles.

Mathesar lets you see the `LOGIN` status of each role, but does not allow you to change it. If you need to change a role's `LOGIN` status, you'll need to do so directly in PostgreSQL.


## Roles vis-à-vis databases

In PostgreSQL, roles live within the _server_ and thus are not necessarily specific to individual databases. One role can be configured to access many different databases; and one database can be configured for access via many different roles. Within the Mathesar interface however, the list of roles is presented _inside_ the page. This structure exists for the sake of convenience &mdash; and because PostgreSQL requires that clients connect to a specific database, even to query the roles present on a server. Nonetheless, it is important to understand that when you add/remove PostgreSQL roles (or edit their child roles), your changes will be visible for all databases which share the same server.

## Ownership

Every PostgreSQL object (e.g. a [table](./tables.md), [schema](./schemas.md), etc.) has one and only one role said to be its "owner". By default the owner is set to the role which created the object.

The owner generally can do anything directly to the object, but not necessarily other objects contained within it. For example, a role might own a schema but not have access to certain tables within the schema.

## Privileges

Specific privileges on objects can be granted to roles, allowing non-owning roles to perform certain actions. See the following sections for more information on configuring these privileges:

- [Database permissions](./databases.md#permissions)
- [Schema permissions](./schemas.md#permissions)
- [Table permissions](./tables.md#permissions)

These privileges cover common actions, but there are still certain actions which remain restricted to object owners and cannot be granted to other roles. For example, only the owner of a table can add new columns to it; there is no way to grant that privilege to a non-owning role.

## Role inheritance {:#inheritance}

PostgreSQL has a mechanism for role inheritance (aka "role membership") wherein any role can be "granted" to any other role. For example, when the role `auditors` is granted to role `bob`, then `bob` will inherit all of the privileges set for `auditors`. While it's common for non-login roles to serve as "groups" which are granted to login roles, any role can actually be granted to any other role. This feature can be used to form simple hierarchies and complex graph-based inheritance structures. See the [PostgreSQL docs](https://www.postgresql.org/docs/current/role-membership.html) for more info.

## Shared ownership

Although every object in PostgreSQL has only one owner, it's still possible configure multiple roles to effectively "own" a single object by leveraging inheritance:

1. We can create a role to directly own the object and act as a sort of proxy "group". (The group role doesn't need to be a `LOGIN` role and thus doesn't require a password to be configured.)
1. Then we can grant _that group role_ to any other roles we'd like.
1. Those child roles will then have permission do things _as if they were the owner themselves_.

You can use Mathesar to configure an arrangement like the above, though it will require many steps.

