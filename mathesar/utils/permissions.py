from mathesar.models.base import Server, Database, Role, UserDatabaseRoleMap
from mathesar.models.deprecated import Connection
from mathesar.models.users import User


def create_user_database_role_map(connection_id, user_id):
    """Move data from old-style connection model to new models."""
    conn = Connection.current_objects.get(id=connection_id)

    server = Server.objects.get_or_create(host=conn.host, port=conn.port)[0]
    database = Database.objects.get_or_create(name=conn.db_name, server=server)[0]
    role = Role.objects.get_or_create(
        name=conn.username, server=server, password=conn.password
    )[0]
    return UserDatabaseRoleMap.objects.create(
        user=User.objects.get(id=user_id),
        database=database,
        role=role,
        server=server
    )
