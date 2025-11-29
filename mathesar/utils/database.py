from django.db import connection
import re

DEPRECATED_MAJOR_VERSIONS = [13]  # Update as needed

def get_postgres_version():
    with connection.cursor() as cursor:
        cursor.execute("SHOW server_version;")
        version = cursor.fetchone()[0]  # e.g., '13.9'
    return version

def is_deprecated_postgres(version_str):
    match = re.match(r"(\d+)", version_str)
    if match:
        major = int(match.group(1))
        return major in DEPRECATED_MAJOR_VERSIONS
    return False
