# Users

Mathesar allows you to set up users with different access levels. A user's access levels determine what they can do with the data managed in Mathesar.

Mathesar's installation process includes setting up the first user. This user is an **Admin**.

## Managing Users

1. Click on the gear icon on the top right of the application and select **Administration**.
2. In the left sidebar, click on **Users**.

!!! note
    - Only **Admins** can add new users.
    - Mathesar does not send invitation emails to new users (yet). You'll need to send the user their username and password yourself.
    - The user will be prompted to change the password when they log in for the first time.

## User Types

Users can be either **Admin** or **Standard** users.

### Admin users

Admin users:

- can manage other users (view, add, edit, delete)
- have **Manager** permissions on all databases and schemas

You cannot set granular permissions for an **Admin** user.

### Standard users

By default, **Standard** users cannot see anything in Mathesar. They will need to be granted database or schema roles individually.
