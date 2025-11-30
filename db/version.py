"""
Utilities for checking PostgreSQL version compatibility and deprecation.
"""

from typing import Optional, TypedDict


class PostgresVersionInfo(TypedDict):
    """Information about a PostgreSQL version."""
    version_string: str
    version_number: int
    major_version: int
    minor_version: int
    is_deprecated: bool
    deprecation_message: Optional[str]


# Define which PostgreSQL versions are deprecated
# Maps major version number to deprecation details
DEPRECATED_POSTGRES_VERSIONS = {
    13: {
        "deprecated_since": "0.8.0",
        "message": "PostgreSQL 13 is no longer supported. Please upgrade to PostgreSQL 14 or higher."
    }
}

# Minimum supported PostgreSQL version
MINIMUM_SUPPORTED_VERSION = 14


def get_postgres_version(conn) -> PostgresVersionInfo:
    """
    Get the PostgreSQL version information from a connection.

    Args:
        conn: A psycopg connection

    Returns:
        PostgresVersionInfo: Dictionary containing version details
    """
    result = conn.execute("SHOW server_version_num").fetchone()
    version_number = int(result[0])
    
    # Extract major and minor versions
    # PostgreSQL version numbers are in format XXYYZZ where XX=major, YY=minor, ZZ=patch
    major_version = version_number // 10000
    minor_version = (version_number % 10000) // 100
    
    # Get version string
    version_string_result = conn.execute("SHOW server_version").fetchone()
    version_string = version_string_result[0]
    
    # Check if this version is deprecated
    is_deprecated = major_version in DEPRECATED_POSTGRES_VERSIONS
    deprecation_message = None
    if is_deprecated:
        deprecation_message = DEPRECATED_POSTGRES_VERSIONS[major_version]["message"]
    
    return PostgresVersionInfo(
        version_string=version_string,
        version_number=version_number,
        major_version=major_version,
        minor_version=minor_version,
        is_deprecated=is_deprecated,
        deprecation_message=deprecation_message
    )


def is_postgres_version_deprecated(major_version: int) -> bool:
    """
    Check if a PostgreSQL major version is deprecated.

    Args:
        major_version: The major version number (e.g., 13, 14, 15)

    Returns:
        bool: True if the version is deprecated, False otherwise
    """
    return major_version in DEPRECATED_POSTGRES_VERSIONS


def get_deprecation_message(major_version: int) -> Optional[str]:
    """
    Get the deprecation message for a PostgreSQL major version.

    Args:
        major_version: The major version number (e.g., 13, 14, 15)

    Returns:
        Optional[str]: The deprecation message, or None if not deprecated
    """
    if major_version in DEPRECATED_POSTGRES_VERSIONS:
        return DEPRECATED_POSTGRES_VERSIONS[major_version]["message"]
    return None
