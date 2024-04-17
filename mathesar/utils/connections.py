"""Utilities to help with creating and managing connections in Mathesar."""
from psycopg2.errors import DuplicateSchema
from sqlalchemy.exc import OperationalError, ProgrammingError
from mathesar.models.base import Database
from db import install, connection as dbconn
from mathesar.state import reset_reflection
from mathesar.examples.library_dataset import load_library_dataset
from mathesar.examples.movies_dataset import load_movies_dataset


class BadInstallationTarget(Exception):
    """Raise when an attempt is made to install on a disallowed target"""
    pass


def copy_connection_from_preexisting(
        connection, nickname, db_name, create_db, sample_data
):
    if connection['connection_type'] == 'internal_database':
        db_model = Database.create_from_settings_key('default')
    elif connection['connection_type'] == 'user_database':
        db_model = Database.current_objects.get(id=connection['id'])
        db_model.id = None
    else:
        raise KeyError("connection_type")
    root_db = db_model.db_name
    return _save_and_install(
        db_model, db_name, root_db, nickname, create_db, sample_data
    )


def create_connection_from_scratch(
        user, password, host, port, nickname, db_name, sample_data
):
    db_model = Database(username=user, password=password, host=host, port=port)
    root_db = db_name
    return _save_and_install(
        db_model, db_name, root_db, nickname, False, sample_data
    )


def create_connection_with_new_user(
        connection, user, password, nickname, db_name, create_db, sample_data
):
    db_model = copy_connection_from_preexisting(
        connection, nickname, db_name, create_db, []
    )
    engine = db_model._sa_engine
    db_model.username = user
    db_model.password = password
    db_model.save()
    dbconn.execute_msar_func_with_engine(
        engine,
        'create_basic_mathesar_user',
        db_model.username,
        db_model.password
    )
    _load_sample_data(db_model._sa_engine, sample_data)
    return db_model


def _save_and_install(
        db_model, db_name, root_db, nickname, create_db, sample_data
):
    db_model.name = nickname
    db_model.db_name = db_name
    _validate_db_model(db_model)
    db_model.save()
    try:
        install.install_mathesar(
            database_name=db_model.db_name,
            username=db_model.username,
            password=db_model.password,
            hostname=db_model.host,
            port=db_model.port,
            skip_confirm=True,
            create_db=create_db,
            root_db=root_db,
        )
    except OperationalError as e:
        db_model.delete()
        raise e
    _load_sample_data(db_model._sa_engine, sample_data)
    return db_model


def _load_sample_data(engine, sample_data):
    DATASET_MAP = {
        'library_management': load_library_dataset,
        'movie_collection': load_movies_dataset,
    }
    for key in sample_data:
        try:
            DATASET_MAP[key](engine, safe_mode=True)
        except ProgrammingError as e:
            if isinstance(e.orig, DuplicateSchema):
                # We swallow this error, since otherwise we'll raise an error on the
                # front end even though installation generally succeeded.
                continue
    reset_reflection()


def _validate_db_model(db_model):
    internal_db_model = Database.create_from_settings_key('default')
    if (
            internal_db_model is not None
            and db_model.host == internal_db_model.host
            and db_model.port == internal_db_model.port
            and db_model.db_name == internal_db_model.db_name
    ):
        raise BadInstallationTarget(
            "Mathesar can't be installed in the internal DB namespace"
        )
