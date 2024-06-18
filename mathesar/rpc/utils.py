from mathesar.models.base import UserDatabaseRoleMap


def connect(database_id, user):
    """
    Return a psycopg connection, given a Connection model id.

    Args:
        conn_id: The Django id corresponding to the Connection.
    """
    user_database_role = UserDatabaseRoleMap.objects.get(
        user=user, database__id=database_id
    )
    return user_database_role.connection
