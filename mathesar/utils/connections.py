"""Utilities to help with creating and managing connections in Mathesar."""
from mathesar.models.base import Database
from db import install


def copy_connection_from_preexisting(
        connection, nickname, db_name, create_db, sample_data
):
    if connection['connection_type'] == 'internal_database':
        db_model = Database.create_from_settings_key('default')
    elif connection['connection_type'] == 'user_database':
        db_model = Database.current_objects.get(id=connection['id'])
        db_model.id = None
    else:
        raise KeyError
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


def _save_and_install(
        db_model, db_name, root_db, nickname, create_db, sample_data
):
    db_model.name = nickname
    db_model.db_name = db_name
    _validate_db_model(db_model)
    db_model.save()
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
    return db_model


def _validate_db_model(db_model):
    internal_db_model = Database.create_from_settings_key('default')
    if (
            internal_db_model is not None
            and db_model.host == internal_db_model.host
            and db_model.port == internal_db_model.port
            and db_model.db_name == internal_db_model.db_name
    ):
        raise Exception(
            "Mathesar can't be installed in the internal DB namespace"
        )
