"""Utilities to help with creating and managing connections in Mathesar."""
from mathesar.models.base import Database
from db import install

def create_connection_from_internal_db_connection(
        database, nickname, create_db=False, sample_data=None
):
    """
    Create a new connection based on the credentials of the internal DB user.

    Args:
        database:    name of the DB we'll connect to. Must be different from the
                     name of the internal DB.
        nickname:    nickname to give the DB for display to users
        create_db:   whether we should create the target DB if it doesn't
                     already exist.
        sample_data: list naming any sample data sets we should include.
    """
    db_model = Database.create_from_settings_key('default')
    db_model.name = nickname
    if database != db_model.db_name:
        root_db = db_model.db_name
        db_model.db_name = database
    else:
        raise AssertionError(
            "Mathesar can't be installed in the internal DB namespace"
        )
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
