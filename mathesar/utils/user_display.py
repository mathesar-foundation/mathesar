"""
Utilities for building user display values from Mathesar User model.

This module provides functions to fetch user display values from the Django User model
and format them for display in cells (similar to linked record summaries).
"""

from mathesar.models import User


def get_user_display_values(
    user_ids: set[int],
    display_field: str,
) -> dict[str, str]:
    """
    Get user display values for a set of user IDs.

    Args:
        user_ids: A set of user IDs to get display values for
        display_field: The user field to display (full_name, email, or username)

    Returns:
        A dictionary mapping user ID strings to display value strings
    """
    if not user_ids:
        return {}

    users = User.objects.filter(id__in=user_ids)
    user_map = {user.id: user for user in users}

    display_values = {}
    for user_id in user_ids:
        user = user_map.get(user_id)
        if user:
            value = getattr(user, display_field, None)
            display_values[str(user_id)] = value or ""

    return display_values


def get_user_linked_record_summaries(columns_meta_data, results):
    """
    Build user display values for user columns in the given results.

    Args:
        columns_meta_data: List of column metadata objects (already fetched)
        results: List of record dicts from the database

    Returns:
        A dict mapping column attnum strings to user display value dicts,
        or None if there are no user columns.
    """
    user_columns = [
        (c.attnum, c.user_display_field)
        for c in columns_meta_data
        if c.user_display_field
    ]
    if not user_columns:
        return None

    linked_record_summaries = {}
    for column_attnum, display_field in user_columns:
        user_ids = set()
        for record in results:
            user_id = record.get(str(column_attnum))
            if user_id is not None:
                try:
                    user_ids.add(int(user_id) if not isinstance(user_id, int) else user_id)
                except (ValueError, TypeError):
                    continue
        if user_ids:
            user_display_values = get_user_display_values(user_ids, display_field)
            if user_display_values:
                linked_record_summaries[str(column_attnum)] = user_display_values

    return linked_record_summaries if linked_record_summaries else None


def apply_track_editing_user(record_def, table_meta_data, user_id):
    """
    Return a new record_def with the user-tracking column set to the user ID.

    Args:
        record_def: The original record definition dict
        table_meta_data: TableMetaData model instance (or None)
        user_id: The ID of the current user

    Returns:
        A new dict with the user_tracking_attnum column set to user_id,
        or the original record_def if no tracking column is configured.
    """
    if not table_meta_data or not table_meta_data.user_tracking_attnum:
        return record_def
    result = dict(record_def)
    result[str(table_meta_data.user_tracking_attnum)] = user_id
    return result
