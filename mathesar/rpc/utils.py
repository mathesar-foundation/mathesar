from mathesar.models.base import UserDatabaseRoleMap


def connect(database_id, user):
    """
    Get a psycopg database connection.

    Args:
        database_id: The Django id of the Database used for connecting.
        user: A user model instance who'll connect to the database.
    """
    user_database_role = UserDatabaseRoleMap.objects.get(
        user=user, database__id=database_id
    )
    return user_database_role.connection
