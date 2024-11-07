from django.db import connection as internal_conn, transaction
from django.conf import settings
import psycopg
from psycopg.errors import DuplicateSchema

from db.databases import create_database
from db.sql.install import install as install_sql
from mathesar.examples.library_dataset import load_library_dataset
from mathesar.examples.movies_dataset import load_movies_dataset
from mathesar.models.base import Server, Database, ConfiguredRole, UserDatabaseRoleMap

INTERNAL_DB_KEY = 'default'
HOST = "HOST"
PORT = "PORT"
USER = "USER"
PASSWORD = "PASSWORD"
NAME = "NAME"


class BadInstallationTarget(Exception):
    """Raise when an attempt is made to install on a disallowed target"""
    pass


@transaction.atomic
def set_up_new_database_for_user_on_internal_server(
        database_name, user, sample_data=[]
):
    """
    Create a database on the internal server and install Mathesar.

    This database will be set up to be accessible for the given user.
    """
    conn_info = settings.DATABASES[INTERNAL_DB_KEY]
    if database_name == conn_info[NAME]:
        raise BadInstallationTarget(
            "Mathesar can't be installed in the internal database."
        )
    user_database_role = _setup_connection_models(
        conn_info[HOST],
        conn_info[PORT],
        database_name,
        conn_info[USER],
        conn_info[PASSWORD],
        user
    )
    with psycopg.connect(
            host=conn_info[HOST],
            port=conn_info[PORT],
            dbname=conn_info[NAME],
            user=conn_info[USER],
            password=conn_info[PASSWORD],
    ) as root_conn:
        create_database(database_name, root_conn)
    with user_database_role.connection as conn:
        install_sql(conn)
        _load_sample_data(conn, sample_data)
    return user_database_role


@transaction.atomic
def set_up_preexisting_database_for_user(
        host, port, database_name, role_name, password, user, sample_data=[]
):
    internal_conn_info = settings.DATABASES[INTERNAL_DB_KEY]
    if (
            host == internal_conn_info[HOST]
            and port == internal_conn_info[PORT]
            and database_name == internal_conn_info[NAME]
    ):
        raise BadInstallationTarget(
            "Mathesar can't be installed in the internal database."
        )
    user_database_role = _setup_connection_models(
        host, port, database_name, role_name, password, user
    )
    with user_database_role.connection as conn:
        install_sql(conn)
        _load_sample_data(conn, sample_data)
    return user_database_role


@transaction.atomic
def _setup_connection_models(
        host, port, database_name, role_name, password, user
):
    server, _ = Server.objects.get_or_create(host=host, port=port)
    database, _ = Database.objects.get_or_create(
        name=database_name, server=server
    )
    configured_role, _ = ConfiguredRole.objects.get_or_create(
        name=role_name,
        server=server,
        defaults={"password": password},
    )
    return UserDatabaseRoleMap.objects.get_or_create(
        user=user,
        database=database,
        configured_role=configured_role,
        server=server
    )[0]


def _load_sample_data(conn, sample_data):
    DATASET_MAP = {
        'library_management': load_library_dataset,
        'movie_collection': load_movies_dataset,
    }
    for key in sample_data:
        try:
            DATASET_MAP[key](conn)
        except DuplicateSchema:
            # We swallow this error, since otherwise we'll raise an
            # error on the front end even though installation
            # generally succeeded.
            continue
