# Live Demo mode

This folder includes code related to enabling "live demo mode" for Mathesar.

To run Mathesar in "live demo mode" locally, add the following to your local `.env` file:

```
DJANGO_SETTINGS_MODULE=demo.settings
MATHESAR_LIVE_DEMO_USERNAME=admin
MATHESAR_LIVE_DEMO_PASSWORD=password
```

`MATHESAR_LIVE_DEMO_USERNAME` and `MATHESAR_LIVE_DEMO_PASSWORD` are optional – if you set these, then the login credentials will be shown on the login page. If either is omitted, credentials will not be shown.
