# Demo mode

This folder includes code related to enabling "demo mode" for Mathesar.

When Mathesar is in demo mode it has the following special behavior:

- A new database is created for every user session
- A banner displays atop the UI
- Analytics are enabled, sending data to the Mathesar team

## Running

To run Mathesar in demo mode locally, add the following to your local `.env` file:

```
DJANGO_SETTINGS_MODULE=demo.settings
MATHESAR_LIVE_DEMO_USERNAME=admin
MATHESAR_LIVE_DEMO_PASSWORD=password
```

`MATHESAR_LIVE_DEMO_USERNAME` and `MATHESAR_LIVE_DEMO_PASSWORD` are optional – if you set these, then the login credentials will be shown on the login page. If either is omitted, credentials will not be shown.

If you've not yet created the template database, you'll have to run the Django management command for that:

```
docker exec mathesar_service_dev sh -c "python manage.py setup_demo_template_db"
```

That might require you to restart or [rebuild/recreate your docker compose environment](https://github.com/centerofci/mathesar/blob/develop/DEVELOPER_GUIDE.md#rebuilding-the-docker-images).

## Details

Below information is up-to-date as of time of writting (2023-07-05).

### How demo datasets are defined

The gist of it can be seen in [`load_datasets` function](https://github.com/centerofci/mathesar/blob/0d99ee984206a99c6743a319504a1d86621d71d5/demo/install/datasets.py#L18C11-L18C11). The [Arxiv dataset](https://github.com/centerofci/mathesar/blob/0d99ee984206a99c6743a319504a1d86621d71d5/demo/install/datasets.py#L73C18-L73C18) is special, however. It is regularly updated via a cron job, thus giving a demo of how Mathesar can share databases with other systems.

### How each user gets a session and each session gets a database

We use [Django middleware](https://github.com/centerofci/mathesar/blob/0d99ee984206a99c6743a319504a1d86621d71d5/demo/middleware.py#L19C19-L19C19) to intercept new guest sessions and perform the provisioning. Our intent is for each user to have his own database that will not be contaminated by other demo users.

### How guest databases are provisioned (template database)

When a new guest (demo user) is being provisioned, [we create a dedicated database for him, using Postgres' template databases feature](https://github.com/centerofci/mathesar/blob/0d99ee984206a99c6743a319504a1d86621d71d5/demo/install/base.py#L67C37-L67C37). Using a template database allows us to only have to copy it to create a new database with our demo datasets setup.

The template database is setup [when our demo server is being provisioned by Ansible](https://github.com/centerofci/mathesar-ansible/blob/7a5db8bd13e86bbf191b4dd95e66cd138a512d36/roles/demo/tasks/main.yml#L39). [`setup_demo_template_db`](https://github.com/centerofci/mathesar/blob/0d99ee984206a99c6743a319504a1d86621d71d5/demo/management/commands/setup_demo_template_db.py#L11) is the Django management command that Ansible calls. The most interesting part of it is [loading the demo datasets](https://github.com/centerofci/mathesar/blob/0d99ee984206a99c6743a319504a1d86621d71d5/demo/install/datasets.py#L18).
