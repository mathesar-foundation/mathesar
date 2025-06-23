from django.db import transaction
import psycopg
from psycopg.errors import DuplicateSchema

from config.database_config import get_internal_database_config
from db.databases import create_database
from db.connection import mathesar_connection
from mathesar.examples.bike_shop_dataset import load_bike_shop_dataset
from mathesar.examples.hardware_store_dataset import load_hardware_store_dataset
from mathesar.examples.ice_cream_employees_dataset import load_ice_cream_employees_dataset
from mathesar.examples.library_dataset import load_library_dataset
from mathesar.examples.library_makerspace_dataset import load_library_makerspace_dataset
from mathesar.examples.museum_exhibits_dataset import load_museum_exhibits_dataset
from mathesar.examples.nonprofit_grants_dataset import load_nonprofit_grants_dataset
from mathesar.models.base import Server, Database, ConfiguredRole, UserDatabaseRoleMap


class BadInstallationTarget(Exception):
    """Raise when an attempt is made to install on a disallowed target"""
    pass


@transaction.atomic
def set_up_new_database_for_user_on_internal_server(
        database_name, nickname, user, sample_data=[]
):
    """
    Create a database on the internal server and install Mathesar.

    This database will be set up to be accessible for the given user.
    """
    conn_info = get_internal_database_config()
    if database_name == conn_info.dbname:
        raise BadInstallationTarget(
            "Mathesar can't be installed in the internal database."
        )
    user_database_role = _setup_connection_models(
        conn_info.host,
        conn_info.port,
        database_name,
        nickname,
        conn_info.role,
        conn_info.password,
        user
    )
    with mathesar_connection(
            host=conn_info.host,
            port=conn_info.port,
            dbname=conn_info.dbname,
            user=conn_info.role,
            password=conn_info.password,
            application_name='mathesar.utils.permissions.set_up_new_database_for_user_on_internal_server',
    ) as root_conn:
        create_database(database_name, root_conn)
    user_database_role.database.install_sql(
        username=conn_info.role, password=conn_info.password
    )
    with user_database_role.connection as conn:
        _load_sample_data(conn, sample_data)
    return user_database_role


@transaction.atomic
def set_up_preexisting_database_for_user(
        host, port, database_name, nickname, role_name, password, user, sample_data=[]
):
    internal_conn_info = get_internal_database_config()
    if (
            host == internal_conn_info.host
            and port == internal_conn_info.port
            and database_name == internal_conn_info.dbname
    ):
        raise BadInstallationTarget(
            "Mathesar can't be installed in the internal database."
        )
    user_database_role = _setup_connection_models(
        host, port, database_name, nickname, role_name, password, user
    )
    user_database_role.database.install_sql(
        username=user_database_role.configured_role.name,
        password=user_database_role.configured_role.password,
    )
    with user_database_role.connection as conn:
        _load_sample_data(conn, sample_data)
    return user_database_role


@transaction.atomic
def _setup_connection_models(
        host, port, database_name, nickname, role_name, password, user
):
    server, _ = Server.objects.get_or_create(host=host, port=port)
    database, _ = Database.objects.get_or_create(
        name=database_name, nickname=nickname, server=server
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
        'bike_shop': load_bike_shop_dataset,
        'hardware_store': load_hardware_store_dataset,
        'ice_cream_employees': load_ice_cream_employees_dataset,
        'library_makerspace': load_library_makerspace_dataset,
        'library_management': load_library_dataset,
        'museum_exhibits': load_museum_exhibits_dataset,
        'nonprofit_grants': load_nonprofit_grants_dataset,
    }
    for key in sample_data:
        try:
            DATASET_MAP[key](conn)
        except DuplicateSchema:
            # We swallow this error, since otherwise we'll raise an
            # error on the front end even though installation
            # generally succeeded.
            continue
