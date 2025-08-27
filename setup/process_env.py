"""
This script reads .env file content from standard input.
It makes sure that the PostgreSQL connection is verified even if PG values are present.

If the required PostgreSQL variables are missing or if the connection fails, a connection string must be
provided as the first command-line argument.

After verification and possible updating of PG values, the updated content is printed to standard output.
"""

import sys
import psycopg
from urllib.parse import urlparse


def parse_env(content):
    """
    Parse .env file content.
    Returns a tuple: (list_of_lines, dict_of_variables)
    """
    lines = content.splitlines(keepends=True)
    env_vars = {}
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        if '=' in stripped:
            key, value = stripped.split('=', 1)
            # Remove surrounding quotes from value if present.
            env_vars[key.strip()] = value.strip().strip('"')
    return lines, env_vars


def format_env_line(key, value):
    return f'{key}="{value}"\n'


def update_env_lines(lines, updates):
    """
    Update existing keys or append new keys if missing.
    Return the updated content as a single string.
    """
    updated_keys = set(updates.keys())
    new_lines = []
    for line in lines:
        # Remove empty lines
        if not line.strip():
            continue

        # Preserve lines that are comments or not in key=value format.
        if '=' not in line or line.strip().startswith('#'):
            new_lines.append(line)
            continue

        key, _ = line.split('=', 1)
        key = key.strip()
        if key in updates:
            new_lines.append(format_env_line(key, updates[key]))
            updated_keys.remove(key)
        else:
            new_lines.append(line)

    # For new keys not already present
    if updated_keys:
        for key in updated_keys:
            new_lines.append(format_env_line(key, updates[key]))
    return ''.join(new_lines)


def validate_pg_env_variables(env_vars):
    try:
        with psycopg.connect(
            host=env_vars["POSTGRES_HOST"],
            port=env_vars.get("POSTGRES_PORT", ""),
            dbname=env_vars["POSTGRES_DB"],
            user=env_vars["POSTGRES_USER"],
            password=env_vars.get("POSTGRES_PASSWORD", "")
        ):
            pass

        return True
    except Exception as e:
        sys.exit(f"Unable to connect to the database. {e}")


def construct_env_vars_from_connection_string(connection_string):
    try:
        parsed_url = urlparse(connection_string)

        # Append postgres:// if no url scheme is found!
        # The username could be mistaken as the scheme if password is also present, so
        # also append postgres:// if the scheme is not postgres or postgresql
        if not parsed_url.scheme or parsed_url.scheme not in ["postgres", "postgresql"]:
            connection_string = "postgres://" + connection_string

        # Convert the connection string to a dictionary.
        conninfo_dict = psycopg.conninfo.conninfo_to_dict(connection_string)

        required_keys = ["host", "dbname", "user"]
        missing_keys = [key for key in required_keys if key not in conninfo_dict]
        if missing_keys:
            sys.exit("Invalid: The connection string requires host, user, and dbname")

        env_vars = {
            "POSTGRES_HOST": conninfo_dict["host"],
            "POSTGRES_PORT": conninfo_dict.get("port", ""),
            "POSTGRES_DB": conninfo_dict["dbname"],
            "POSTGRES_USER": conninfo_dict["user"],
            "POSTGRES_PASSWORD": conninfo_dict.get("password", "")
        }

        return env_vars
    except psycopg.ProgrammingError as e:
        sys.exit(f"Invalid: Unable to parse the PostgreSQL connection string. {e}")
    except Exception as e:
        sys.exit(f"Invalid: Unable to process connection string. {e}")


def main():
    # Read entire .env file content from standard input.
    env_content = sys.stdin.read()
    lines, env_vars = parse_env(env_content)

    updates = {}

    connection_string = sys.argv[1].strip() if (len(sys.argv) > 1 and sys.argv[1].strip()) else None

    if connection_string:
        pg_env_vars = construct_env_vars_from_connection_string(connection_string)

    else:
        required_pg_keys = ["POSTGRES_HOST", "POSTGRES_DB", "POSTGRES_USER"]
        is_required_pg_env_vars_missing = any(key not in env_vars or not env_vars[key] for key in required_pg_keys)

        if is_required_pg_env_vars_missing:
            sys.exit("Required PostgreSQL connection parameters are missing in the .env file and no connection string was provided.")

        pg_env_vars = {
            "POSTGRES_HOST": env_vars["POSTGRES_HOST"],
            "POSTGRES_PORT": env_vars.get("POSTGRES_PORT", ""),
            "POSTGRES_DB": env_vars["POSTGRES_DB"],
            "POSTGRES_USER": env_vars["POSTGRES_USER"],
            "POSTGRES_PASSWORD": env_vars.get("POSTGRES_PASSWORD", "")
        }

    if validate_pg_env_variables(pg_env_vars):
        updates.update(pg_env_vars)
        updated_content = update_env_lines(lines, updates)
        sys.stdout.write(updated_content)


if __name__ == "__main__":
    main()
