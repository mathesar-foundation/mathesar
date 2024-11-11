from mathesar.models.base import Database


def connect(database_id, user):
    """
    Get a psycopg database connection.

    Args:
        database_id: The Django id of the Database used for connecting.
        user: A user model instance who'll connect to the database.
    """
    return Database.objects.get(id=database_id).connect_user(user)
