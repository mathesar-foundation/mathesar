from django.db import transaction
from django.conf import settings

from db.install import install_mathesar
from mathesar.examples.library_dataset import load_library_dataset
from mathesar.examples.movies_dataset import load_movies_dataset
from mathesar.models.base import Server, Database, Role, UserDatabaseRoleMap
from mathesar.models.deprecated import Connection
from mathesar.models.users import User
from mathesar.utils.connections import BadInstallationTarget

INTERNAL_DB_KEY = 'default'


def migrate_connection_for_user(connection_id, user_id):
    """Move data from old-style connection model to new models."""
    conn = Connection.current_objects.get(id=connection_id)
    user = User.objects.get(id=user_id)
    return _setup_connection_models(
        conn.host, conn.port, conn.db_name, conn.username, conn.password, user
    )


@transaction.atomic
def set_up_new_database_for_user_on_internal_server(
        database_name, user, sample_data=[]
):
    """
    Create a database on the internal server and install Mathesar.

    This database will be set up to be accessible for the given user.
    """
    conn_info = settings.DATABASES[INTERNAL_DB_KEY]
    if database_name == conn_info["NAME"]:
        raise BadInstallationTarget(
            "Mathesar can't be installed in the internal database."
        )
    user_database_role = _setup_connection_models(
        conn_info["HOST"],
        conn_info["PORT"],
        database_name,
        conn_info["USER"],
        conn_info["PASSWORD"],
        user
    )
    install_mathesar(
        database_name,
        conn_info["USER"],
        conn_info["PASSWORD"],
        conn_info["HOST"],
        conn_info["PORT"],
        True,
        root_db=conn_info["NAME"],
    )
    with user_database_role.connection as conn:
        _load_sample_data(conn, sample_data)
    return user_database_role


@transaction.atomic
def _setup_connection_models(host, port, db_name, role_name, password, user):
    server, _ = Server.objects.get_or_create(host=host, port=port)
    database, _ = Database.objects.get_or_create(name=db_name, server=server)
    role, _ = Role.objects.get_or_create(
        name=role_name,
        server=server,
        defaults={"password": password},
    )
    return UserDatabaseRoleMap.objects.create(
        user=user,
        database=database,
        role=role,
        server=server
    )


def _load_sample_data(conn, sample_data):
    DATASET_MAP = {
        'library_management': load_library_dataset,
        'movie_collection': load_movies_dataset,
    }
    for key in sample_data:
        try:
            DATASET_MAP[key](conn)
        except ProgrammingError as e:
            if isinstance(e.orig, DuplicateSchema):
                # We swallow this error, since otherwise we'll raise an
                # error on the front end even though installation
                # generally succeeded.
                continue
