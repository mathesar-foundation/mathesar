"""
Utilities for managing and retrieving database deprecation warnings.
"""

from typing import TypedDict, Optional, List
from db.version import get_postgres_version, is_postgres_version_deprecated
from mathesar.models.base import Database


class DeprecationWarning(TypedDict):
    """Represents a deprecation warning for a database."""
    database_id: int
    database_name: str
    database_nickname: Optional[str]
    postgres_version: str
    postgres_major_version: int
    warning_message: str
    warning_type: str  # e.g., "postgres_version"


def get_database_deprecation_warnings(database_id: int, user) -> List[DeprecationWarning]:
    """
    Get all deprecation warnings for a specific database.

    Args:
        database_id: The Django ID of the database
        user: The user making the request

    Returns:
        List[DeprecationWarning]: List of deprecation warnings for the database
    """
    warnings = []
    database = Database.objects.get(id=database_id)
    
    try:
        with database.connect_user(user) as conn:
            version_info = get_postgres_version(conn)
            
            if version_info["is_deprecated"]:
                warning = DeprecationWarning(
                    database_id=database.id,
                    database_name=database.name,
                    database_nickname=database.nickname,
                    postgres_version=version_info["version_string"],
                    postgres_major_version=version_info["major_version"],
                    warning_message=version_info["deprecation_message"],
                    warning_type="postgres_version"
                )
                warnings.append(warning)
    except Exception:
        # If we can't connect to the database, we can't check for deprecations
        pass
    
    return warnings


def get_all_database_deprecation_warnings(user) -> List[DeprecationWarning]:
    """
    Get all deprecation warnings across all databases the user has access to.

    Args:
        user: The user making the request

    Returns:
        List[DeprecationWarning]: List of all deprecation warnings
    """
    warnings = []
    
    # Get all database connections the user has
    from mathesar.models.base import UserDatabaseRoleMap
    
    role_maps = UserDatabaseRoleMap.objects.filter(user=user)
    for role_map in role_maps:
        database = role_map.database
        db_warnings = get_database_deprecation_warnings(database.id, user)
        warnings.extend(db_warnings)
    
    return warnings


def get_internal_database_deprecation_warnings(database_id: int) -> List[DeprecationWarning]:
    """
    Get deprecation warnings for the internal Mathesar database.
    This checks the postgres version without requiring a specific user.

    Args:
        database_id: The Django ID of the database

    Returns:
        List[DeprecationWarning]: List of deprecation warnings
    """
    warnings = []
    database = Database.objects.get(id=database_id)
    
    try:
        with database.connect_admin() as conn:
            version_info = get_postgres_version(conn)
            
            if version_info["is_deprecated"]:
                warning = DeprecationWarning(
                    database_id=database.id,
                    database_name=database.name,
                    database_nickname=database.nickname,
                    postgres_version=version_info["version_string"],
                    postgres_major_version=version_info["major_version"],
                    warning_message=version_info["deprecation_message"],
                    warning_type="postgres_version"
                )
                warnings.append(warning)
    except Exception:
        # If we can't connect to the database, we can't check for deprecations
        pass
    
    return warnings
