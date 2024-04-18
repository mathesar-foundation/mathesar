from mathesar.database.base import get_psycopg_connection
from mathesar.models.base import Database


def connect(db_id):
    """
    Return a psycopg connection, given a Database model id.

    Args:
        db_id: The Django id corresponding to the Database.
    """
    db_model = Database.current_objects.get(id=db_id)
    return get_psycopg_connection(db_model)
