from django.db import connection
import re

DEPRECATED_MAJOR_VERSIONS = [13]  
NEXT_RELEASE = "0.8.0"            
def get_postgres_version():
    
    with connection.cursor() as cursor:
        cursor.execute("SHOW server_version;")
        version = cursor.fetchone()[0]
    return version

def is_deprecated_postgres(version_str):
    if not version_str:
        return False
    match = re.match(r"(\d+)", version_str)
    if match:
        major = int(match.group(1))
        return major in DEPRECATED_MAJOR_VERSIONS
    return False

def get_postgres_version_info():
    version_str = get_postgres_version()
    major = None
    deprecated = False

    if version_str:
        match = re.match(r"(\d+)", version_str)
        if match:
            major = int(match.group(1))
            deprecated = major in DEPRECATED_MAJOR_VERSIONS

    return {
        "version": version_str,
        "major": major,
        "deprecated": deprecated,
        "message": (
            f"⚠️ Deprecation Notice: PostgreSQL {major} will no longer be supported "
            f"starting in Mathesar {NEXT_RELEASE}. Please upgrade to PostgreSQL 14 or higher."
            if deprecated and major else None
        )
    }
