# Mathesar API

The Mathesar API is built with [Django REST Framework](https://www.django-rest-framework.org/) (aka DRF).

## Namespaces

The API is split into two namespaces:

- `db` for APIs that relate to the user database
- `ui` for APIs that relate do the Mathesar database (where we store metadata)

## Browsable API

DRF provides a simple web-based UI for interacting with the Mathesar API. After logging in through the Mathesar UI, you can browse the root of each API namespace at the following URLs:

- http://localhost:8000/api/db/v0/
- http://localhost:8000/api/ui/v0/

If you prefer a non-browser tool for API development, you'll have to:

1. Use browser to execute one of the methods above, then
1. Extract the key, value pair for the cookie named `sessionid` using dev tools.
1. submit that cookie with each request until it expires.
1. Repeat as necessary (e.g., when the cookie expires).
