# Demo mode

This folder includes code related to enabling "demo mode" for Mathesar.

When Mathesar is in demo mode it has the following special behavior:

- A new database is created for every user session
- A banner displays atop the UI
- Analytics are enabled, sending data to the Mathesar team

To run Mathesar in demo mode locally, add the following to your local `.env` file:

```
DJANGO_SETTINGS_MODULE=demo.settings
MATHESAR_LIVE_DEMO_USERNAME=admin
MATHESAR_LIVE_DEMO_PASSWORD=password
```

`MATHESAR_LIVE_DEMO_USERNAME` and `MATHESAR_LIVE_DEMO_PASSWORD` are optional – if you set these, then the login credentials will be shown on the login page. If either is omitted, credentials will not be shown.
