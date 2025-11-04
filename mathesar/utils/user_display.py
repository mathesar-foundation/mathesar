"""
Utilities for building user display values from Mathesar User model.

This module provides functions to fetch user display values from the Django User model
and format them for display in cells (similar to linked record summaries).
"""
from typing import Optional

from mathesar.models import User
from mathesar.utils.columns import get_columns_meta_data


def get_user_display_values_for_column(
    table_oid: int,
    database_id: int,
    column_attnum: int,
    user_ids: set[Optional[int]]
) -> dict[str, str]:
    """
    Get user display values for a set of user IDs, formatted for a specific column.

    Args:
        table_oid: The OID of the table containing the column
        database_id: The Django database ID
        column_attnum: The attnum of the user column
        user_ids: A set of user IDs to get display values for

    Returns:
        A dictionary mapping user ID strings to display value strings
    """
    # Filter out None values
    valid_user_ids = {uid for uid in user_ids if uid is not None}

    if not valid_user_ids:
        return {}

    # Get column metadata to determine display field
    columns_meta_data = get_columns_meta_data(table_oid, database_id)
    display_field = "full_name"  # Default
    for col_meta in columns_meta_data:
        if col_meta.attnum == column_attnum and col_meta.user_type:
            display_field = col_meta.user_display_field or "full_name"
            break

    # Fetch users in bulk
    users = User.objects.filter(id__in=valid_user_ids)
    user_map = {user.id: user for user in users}

    # Build display values using the specified display field
    display_values = {}
    for user_id in valid_user_ids:
        user = user_map.get(user_id)
        if user:
            value = getattr(user, display_field, None)
            display_values[str(user_id)] = value or ""

    return display_values


def get_user_columns_for_table(table_oid: int, database_id: int) -> list[int]:
    """
    Get the list of column attnums that are user type columns.

    Args:
        table_oid: The OID of the table
        database_id: The Django database ID

    Returns:
        A list of column attnums that are user type columns
    """
    columns_meta_data = get_columns_meta_data(table_oid, database_id)
    return [
        c.attnum for c in columns_meta_data
        if c.user_type
    ]


def get_last_edited_by_columns_for_table(table_oid: int, database_id: int) -> list[int]:
    """
    Get the list of column attnums that are user type columns with user_last_edited_by enabled.

    Args:
        table_oid: The OID of the table
        database_id: The Django database ID

    Returns:
        A list of column attnums that should be automatically set to the current user ID
    """
    columns_meta_data = get_columns_meta_data(table_oid, database_id)
    return [
        c.attnum for c in columns_meta_data
        if c.user_type and c.user_last_edited_by
    ]
