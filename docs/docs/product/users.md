# Users & Access Levels

Mathesar facilitates user collaboration by giving multiple users access to the data, at the same time giving you full control over the actions each user can take on that data. This is achieved using roles and permissions.

## Roles

Each user can have one of the following roles:

1. User
2. Admin

`Admin` by default has all of the permissions on all of the resources, can add new users, update details/permissions of the existing users and delete users. While a `User` can only be given specific granular permissions on each resource.

## Permissions

An admin can grant or remove permissions on any database or schema to any user with the role of `User`. Mathesar currently supports the following permissions:

Database Permissions

1. Manager
2. Editor
3. Viewer

Schema Permissions

1. Manager
2. Editor
3. Viewer

### Actions associated with each permission

**Database Permissions**

| Permission                                  | Database Manager        | Database Editor | Database Viewer |
| ------------------------------------------- | ----------------------- | --------------- | --------------- |
| Grant or Revoke permissions on the database | &#9745;                 | -               | -               |
| Add and remove schemas in the database      | &#9745;                 | -               | -               |
| Permissions on all contained schemas        | Manager, Editor, Viewer | Editor, Viewer  | Viewer          |

**Schema Permissions**

| Permission                                | Schema Manager | Schema Editor | Schema Viewer |
| ----------------------------------------- | -------------- | ------------- | ------------- |
| Grant or revoke permissions on the schema | &#9745;        | -             | -             |
| Add and remove tables in the schema       | &#9745;        | -             | -             |
| Add and remove shared explorations        | &#9745;        | &#9745;       | -             |

### Order or precedence of permissions

TODO:

## Add a new user

> Requires `Admin` role.

1. Click on the gear icon on the top right of the application in the navigation bar to open a dropdown menu.
2. Click on the `Administration` option.
3. In the left sidebar click on the `Users` option.
4. Click on the `Add User` button, right next to the search bar.
5. Fill in the form with the required details.
6. You can use any password for now. The user will be prompted to change the password when he/she logs in for the first time.
7. Choose the role as per the explanation here: [Roles](#roles)
8. Click on the `Save` button.

## Editing a user's details and role

> Requires `Admin` role.

1. Click on the gear icon on the top right of the application in the navigation bar to open a dropdown menu.
2. Click on the `Administration` option.
3. In the left sidebar click on the `Users` option.
4. From the list click on the user whose details you want to edit.
5. Edit the desired details. You can even change the role.
6. Click on the `Save` button.

## Deleting a user

> Requires `Admin` role.

1. Click on the gear icon on the top right of the application in the navigation bar to open a dropdown menu.
2. Click on the `Administration` option.
3. In the left sidebar click on the `Users` option.
4. From the list click on the user who you want to delete.
5. Click on the `Delete User` button.
6. In the confirmation modal, again click on the `Delete User` button.

## Granting database-level permissions

> Requires Database Manager permission or `Admin` role.

1. Click on the Mathesar logo on the top left of the navigation bar to go to the database page.
2. Click on the `Manage Access` button right next to the `Create Schema` button.
3. Click on the `Add` button on the top left of the modal.
4. Select the user you want to permit from the user dropdown.
5. Select the appropriate permission from the permission dropdown.
6. Click on the `Add` button right next to the permission dropdown.
7. Close the modal.

## Revoking database-level permissions

> Requires Database Manager permission or `Admin` role.

1. Click on the Mathesar logo on the top left of the navigation bar to go to the database page.
2. Click on the `Manage Access` button right next to the `Create Schema` button.
3. Find the user whose permissions you want to revoke from the list.
4. Click on the delete icon on the right.

## Granting schema-level permissions

> Requires Database Manager or Schema Manager permission or `Admin` role.

1. Click on the Mathesar logo on the top left of the navigation bar to go to the database page.
2. Select the appropriate schema from the list.
3. Click on the `Manage Access` button right next to the `Edit Schema` button.
4. Click on the `Add` button on the top left of the modal.
5. Select the user you want to permit from the user dropdown.
6. Select the appropriate permission from the permission dropdown.
7. Click on the `Add` button right next to the permission dropdown.
8. Close the modal.

## Revoking schema-level permissions

> Requires Database Manager or Schema Manager permission or `Admin` role.

1. Click on the Mathesar logo on the top left of the navigation bar to go to the database page.
2. Select the appropriate schema from the list.
3. Click on the `Manage Access` button right next to the `Edit Schema` button.
4. Find the user whose permissions you want to revoke from the list.
5. Click on the delete icon on the right.
