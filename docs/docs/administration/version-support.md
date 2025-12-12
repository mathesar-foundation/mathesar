# PostgreSQL and Python Version Support

Mathesar supports the versions of Python and PostgreSQL that are officially supported upstream at the time of each Mathesar release. Support for specific versions is only removed when Mathesar makes a minor version update. The table below will be updated as future Mathesar versions are released.

| Mathesar versions | Latest Release Date | Python Versions | PostgreSQL Versions | Description of changes                                          |
| ----------------- | ------------------- | --------------- | ------------------- | --------------------------------------------------------------- |
| 0.8.x             | Upcoming            | 3.10–3.13       | 14–18               | Drops support for PostgreSQL 13                                 |
| 0.7.x             | 2025-10             | 3.10–3.13       | 13–18               | Adds support for PostgreSQL 18 and drops support for Python 3.9 |
| 0.2.x–0.6.x       | 2025-09             | 3.9–3.13        | 13 – 17             | -                                                               |

## Defining "Support" for Mathesar

When Mathesar claims to support a given version of Python or PostgreSQL, it means that our automated test suite is run against that version and we actively ensure compatibility.

If a version of PostgreSQL or Python is _not_ supported, users may still find that Mathesar works fine with it. However:

- Users run Mathesar on such versions **at their own risk**.
- The Mathesar team **cannot assist** in diagnosing or triaging issues specific to unsupported versions.

In other words, unsupported versions may function, but we make no guarantees and cannot provide help for issues encountered there.

## Upstream EOL dates to note

- Python 3.10 is supported upstream until October 2026
- PostgreSQL 14 is supported upstream until November 2026

## Default Python and PostgreSQL versions for Mathesar

- Mathesar's Docker image uses PostgreSQL 17.
- Mathesar's Docker image uses Python 3.13.
- The default PostgreSQL version provided in our example `docker-compose.yml` is 17.

## Regarding Python Support

Python support is mostly relevant for installations using the [Install From Scratch](install-from-scratch.md) instructions.
