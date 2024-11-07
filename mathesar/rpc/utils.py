from mathesar.models.base import ConfiguredRole, Database, UserDatabaseRoleMap


def connect(database_id, user):
    """
    Get a psycopg database connection.

    Args:
        database_id: The Django id of the Database used for connecting.
        user: A user model instance who'll connect to the database.
    """
    try:
        user_database_role = UserDatabaseRoleMap.objects.get(
            user=user, database__id=database_id
        )
    except UserDatabaseRoleMap.DoesNotExist:
        raise NoConnectionAvailable

    return user_database_role.connection


def admin_connect(database_id):
    """
    Get a psycopg connection corresponding to the installing role.

    This function should be used with care, since the resulting connection has
    the right to modify Mathesar system schemata on the database.

    Args:
        database_id: The Django id of the Database used for connecting.
    """
    database = Database.objects.get(id=database_id)
    admin_role_name = None
    admin_role_query = """
    SELECT nspowner::regrole::text
    FROM pg_namespace
    WHERE nspname='msar';
    """

    for role_map in UserDatabaseRoleMap.objects.filter(database=database):
        try:
            with role_map.connection as conn:
                admin_role_name = conn.execute(admin_role_query).fetchone()[0]
                assert admin_role_name is not None
                break
        except:
            pass
    else:
        raise NoConnectionAvailable

    try:
        role = ConfiguredRole.objects.get(
            name=admin_role_name, server=database.server
        )
    except ConfiguredRole.DoesNotExist:
        raise NoAdminConnectionAvailable

    return database.connect(role.name, role.password)


class NoConnectionAvailable(Exception):
    pass


class NoAdminConnectionAvailable(Exception):
    pass
