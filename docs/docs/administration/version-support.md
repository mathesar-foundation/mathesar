# PostgreSQL and Python Version Support

The general strategy of Mathesar is to support whichever versions of Python and PostgreSQL are supported upstream when each release is made. We will only remove support on minor version increases. The following table will be updated as future versions of Mathesar are released.

| Mathesar version | Release Date | Python Versions | PostgreSQL versions |
|------------------|--------------|-----------------|---------------------|
| 0.2.x            | 2025-01      | 3.9-3.13        | 13-17               |

## Upstream EOL dates to note

- Python 3.9 is supported upstream until October 2025
- PostgreSQL 13 is supported upstream until November 2025

## Default Python and PostgreSQL versions for Mathesar 0.2.0

- Mathesar's Docker image uses PostgreSQL 17.
- Mathesar's Docker image uses Python 3.13.
- The default PostgreSQL version provided in our example `docker-compose.yml` is 13.

## Regarding Python Support

Python support is mostly only relevant for installations which followed the [Install From Scratch](install-from-scratch.md) instructions.
