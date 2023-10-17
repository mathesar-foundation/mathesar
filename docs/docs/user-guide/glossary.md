# Glossary

## Internal database {:#internal-db}

The "internal database" holds Mathesar-specific _metadata_ about the actual data (which lives in the [user database](#user-db)). Examples of such metadata include:

- Exploration definitions
- Column display formatting settings
- Record summary template customizations
- Custom column ordering

Each Mathesar installation requires one and only one internal database, and PostgreSQL and SQLite are both supported.

## User database {:#user-db}

The data you see within Mathesar lives in the "user database", which must use PostgreSQL. Each Mathesar installation can connect to multiple user databases, potentially on different servers.

Mathesar also uses an [internal database](#internal-db) to store metadata.

