"""
Utilities for building user summaries from Mathesar User model.

This module provides functions to fetch user summaries from the Django User model
and format them for display in record summaries (similar to linked record summaries).
"""
from typing import Optional

from mathesar.models import User
from mathesar.utils.columns import get_columns_meta_data


def get_user_summary(user_id: Optional[int], display_field: str = "full_name") -> Optional[str]:
    """
    Get a summary string for a user ID using the specified display field.

    Args:
        user_id: The Django user ID, or None
        display_field: Which field to display ('full_name', 'email', or 'username')

    Returns:
        A summary string for the specified field, or None if user doesn't exist
    """
    if user_id is None:
        return None

    try:
        user = User.objects.get(id=user_id)
        if display_field == "full_name":
            return user.full_name or ""
        elif display_field == "email":
            return user.email or ""
        elif display_field == "username":
            return user.username or ""
        else:
            # Default to full_name if invalid field
            return user.full_name or ""
    except User.DoesNotExist:
        # User was deleted, return None
        return None


def get_user_summaries_for_column(
    table_oid: int,
    database_id: int,
    column_attnum: int,
    user_ids: set[Optional[int]]
) -> dict[str, Optional[str]]:
    """
    Get user summaries for a set of user IDs, formatted for a specific column.

    Args:
        table_oid: The OID of the table containing the column
        database_id: The Django database ID
        column_attnum: The attnum of the user column
        user_ids: A set of user IDs to get summaries for

    Returns:
        A dictionary mapping user ID strings to summary strings
    """
    from mathesar.utils.columns import get_columns_meta_data

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

    # Build summaries using the specified display field
    summaries = {}
    for user_id in valid_user_ids:
        user = user_map.get(user_id)
        if user:
            if display_field == "full_name":
                summary = user.full_name or ""
            elif display_field == "email":
                summary = user.email or ""
            elif display_field == "username":
                summary = user.username or ""
            else:
                summary = user.full_name or ""
            summaries[str(user_id)] = summary
        # If user doesn't exist, we just don't include it (returns None when accessed)

    return summaries


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
