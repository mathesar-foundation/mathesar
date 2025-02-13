import subprocess
import os
import sys

DB_NAME = "mathesar"
DB_USER = "mathesar"
DB_PASSWORD = "mathesar"
DB_HOST = "mathesar_dev_db"
SCHEMA_NAME = "Movie Collection"


def main():
    # ----------------------------
    # Configuration
    # ----------------------------
    # Remote PostgreSQL connection details
    DB_HOST = 'mathesar_dev_db'    # e.g., 'db.example.com'
    DB_PORT = 5432                     # default PostgreSQL port
    DB_NAME = 'mathesar'
    SCHEMA_NAME = '"Movie Collection"'
    DB_USER = 'mathesar'
    DB_PASSWORD = 'mathesar'

    # Local path to store the dump file
    local_dump_path = 'sch.dump'

    # ----------------------------
    # Build and run the pg_dump command
    # ----------------------------
    # The -n option restricts the dump to the specified schema.
    # The -F c option creates a custom-format archive, which is useful for backups/restores.
    command = [
        'pg_dump',
        '-h', DB_HOST,
        '-p', str(DB_PORT),
        '-U', DB_USER,
        '-d', DB_NAME,
        '-n', SCHEMA_NAME,
        '-F', 'c',
        '-f', local_dump_path
    ]

    print("Executing pg_dump command:")
    print(" ".join(command))

    # Set up the environment variable so that pg_dump can use the password
    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD

    try:
        subprocess.run(command, check=True, env=env)
        print(f"Dump created successfully and saved to {local_dump_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error during pg_dump execution: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
    print(os.environ)
