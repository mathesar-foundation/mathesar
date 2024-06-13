from mathesar.database.base import get_psycopg_connection
from mathesar.models.base import Connection


def connect(conn_id, user):
    """
    Return a psycopg connection, given a Connection model id.

    Args:
        conn_id: The Django id corresponding to the Connection.
    """
    print("User is: ", user)
    conn_model = Connection.current_objects.get(id=conn_id)
    return get_psycopg_connection(conn_model)
