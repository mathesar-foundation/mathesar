# Mathesar Users

Each Mathesar installation can have multiple users, allowing different people to sign in, either with their own password or via [single sign-on (SSO)](../administration/single-sign-on.md), and work with the same data collaboratively.

## Managing Users

To manage the users in you Mathesar installation, navigate to the users page:

1. Click on the gear icon on the top right of the application and select **Administration**.
1. In the left sidebar, click on **Users**.

!!! info "Note"
    - Any user with an admin-assigned password (new or edited) will be prompted to change their password after logging in.
    - Newly added users won't see any of the connected databases unless you either make them admin users or explicitly add them as [collaborators](./collaborators.md) to each database.
	- If your Mathesar server [uses SSO](../administration/single-sign-on.md), then users are automatically managed by your identity provider. You'll still see a list of users on this page, but you won't be able to manage them fully. For example, if you delete a user, they may log in again and will have a new user created for them if they do.

## Admin vs Standard users {:#admin}

Each Mathesar user is either **Admin** or **Standard**.

Admin users have the following capabilities which Standard users do not:

- Admins can can manage other Mathesar users (view, add, edit, delete).
- Admins can connect and disconnect [databases](./databases.md).
- Admins can save, update, and remove the stored passwords for PostgreSQL [roles](./roles.md).
- Admins can manage [collaborators](./collaborators.md). This allows an Admin user to grant any Mathesar user access to a database through a PostgreSQL role that the Admin specifies.

Upon installing Mathesar, your first user will be an Admin user. Admins can only be created manually via the Mathesar UI, even if SSO is enabled.

## Limitations

- Mathesar does not send invitation emails to new users (yet). You'll need to send the user their username and password yourself.
- Nor is there yet an email-based password recovery mechanism. If you are locked out of your Mathesar installation's web interface, your system administrator can still [use the command line reset any user's password](https://stackoverflow.com/questions/6358030/how-to-reset-django-admin-password).
