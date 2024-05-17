import json
from psycopg.errors import (
    InvalidTextRepresentation, InvalidParameterValue, RaiseException,
    SyntaxError
)
from db import connection as db_conn
from db.columns.defaults import NAME, NULLABLE, DESCRIPTION
from db.columns.exceptions import InvalidDefaultError, InvalidTypeError, InvalidTypeOptionError


def alter_column_deprecated(engine, table_oid, column_attnum, column_data, connection=None):
    """
    Alter a column of the a table.

    Args:
        engine: An SQLAlchemy engine defining the database connection string.
        table_oid: integer giving the OID of the table with the column.
        column_attnum: integer giving the attnum of the column to alter.
        column_data: dictionary describing the alterations to make.
        connection: A connection to use. Remove ASAP.

    column_data should have the form:
    {
        "type": <str>
        "type_options": <dict>,
        "column_default_dict": {"is_dynamic": <bool>, "value": <any>}
        "nullable": <str>,
        "name": <str>,
        "description": <str>
    }
    """
    column_alter_def = _process_column_alter_dict(column_data, column_attnum)
    requested_type = column_alter_def.get("type", {}).get("name")
    if connection is None:
        try:
            db_conn.execute_msar_func_with_engine(
                engine, 'alter_columns',
                table_oid,
                json.dumps([column_alter_def])
            )
        except InvalidParameterValue:
            raise InvalidTypeOptionError
        except InvalidTextRepresentation:
            if column_alter_def.get('default') is None:
                column_db_name = db_conn.execute_msar_func_with_engine(
                    engine, 'get_column_name', table_oid, column_attnum
                ).fetchone()[0]
                raise InvalidTypeError(column_db_name, requested_type)
            else:
                raise InvalidDefaultError
        except RaiseException:
            column_db_name = db_conn.execute_msar_func_with_engine(
                engine, 'get_column_name', table_oid, column_attnum
            ).fetchone()[0]
            raise InvalidTypeError(column_db_name, requested_type)
        except SyntaxError as e:
            # TODO this except catch is too broad; syntax errors can be caused
            # by many things, especially programmer errors during development.
            # find a way to be more selective about what we call an invalid
            # type option error.
            raise InvalidTypeOptionError(e)
    else:
        db_conn.execute_msar_func_with_psycopg2_conn(
            connection, 'alter_columns',
            table_oid,
            f"'{json.dumps([column_alter_def])}'"
        )


def alter_column_type(
    table_oid, column_attnum, engine, connection, target_type, type_options=None
):
    """
    Alter the type of a single column.

    Args:
        table_oid: integer giving the OID of the table with the column.
        column_attnum: integer giving the attnum of the column.
        engine: SQLAlchemy engine defining the connection string for the DB.
        connection: psycopg2 connection object.
        target_type: PostgresType defining the type to alter to.
        type_options: dict defining the options for the type to alter to.
    """
    alter_column_deprecated(
        engine,
        table_oid,
        column_attnum,
        {"type": target_type.id, "type_options": type_options},
        connection=connection
    )


# TODO remove once table splitting logic is moved to SQL.
def rename_column(table_oid, column_attnum, engine, connection, new_name):
    """
    Rename a single column.

    Args:
        table_oid: integer giving the OID of the table with the column.
        column_attnum: integer giving the attnum of the column.
        engine: SQLAlchemy engine defining the connection string for the DB.
        connection: psycopg2 connection object.
        new_name: string giving the new name for the column.
    """
    alter_column_deprecated(
        engine,
        table_oid,
        column_attnum,
        {"name": new_name},
        connection=connection
    )


def _validate_columns_for_batch_update(column_data):
    ALLOWED_KEYS = ['attnum', 'name', 'type', 'type_options', 'delete']
    for single_column_data in column_data:
        if 'attnum' not in single_column_data.keys():
            raise ValueError('Key "attnum" is required')
        for key in single_column_data.keys():
            if key not in ALLOWED_KEYS:
                allowed_key_list = ', '.join(ALLOWED_KEYS)
                raise ValueError(f'Key "{key}" found in columns. Keys allowed are: {allowed_key_list}')


def batch_alter_table_drop_columns(table_oid, column_data_list, connection, engine):
    """
    Drop the given columns from the given table.

    Args:
        table_oid: OID of the table whose columns we'll drop.
        column_data_list: List of dictionaries describing columns to alter.
        connection: the connection (if any) to use with the database.
        engine: the SQLAlchemy engine to use with the database.

    Returns:
        A string of the command that was executed.
    """
    columns_to_drop = [
        int(col['attnum']) for col in column_data_list
        if col.get('attnum') is not None and col.get('delete') is not None
    ]

    if connection is not None and columns_to_drop:
        return db_conn.execute_msar_func_with_psycopg2_conn(
            connection, 'drop_columns', int(table_oid), *columns_to_drop
        )
    elif columns_to_drop:
        return db_conn.execute_msar_func_with_engine(
            engine, 'drop_columns', int(table_oid), *columns_to_drop
        )


def batch_update_columns(table_oid, engine, column_data_list):
    """
    Alter the given columns of the table.

    For details on the column_data_list format, see _process_column_alter_dict.

    Args:
        table_oid: the OID of the table whose columns we'll alter.
        engine: The SQLAlchemy engine to use with the database.
        column_data_list: A list of dictionaries describing alterations.
    """
    _validate_columns_for_batch_update(column_data_list)
    try:
        db_conn.execute_msar_func_with_engine(
            engine, 'alter_columns',
            table_oid,
            json.dumps(
                [_process_column_alter_dict(column) for column in column_data_list]
            )
        )
    except InvalidParameterValue:
        raise InvalidTypeOptionError
    except InvalidTextRepresentation:
        raise InvalidTypeError(None, None)
    except RaiseException:
        raise InvalidTypeError(None, None)
    except SyntaxError:
        raise InvalidTypeOptionError


def _process_column_alter_dict(column_data, column_attnum=None):
    """
    Transform the column_data dict into the form needed for the DB functions.

    Input column_data form:
    {
        "type": <str>
        "type_options": <dict>,
        "column_default_dict": {"is_dynamic": <bool>, "value": <any>}
        "nullable": <bool>,
        "name": <str>,
        "delete": <bool>,
        "description": <str>
    }

    Output form:
    {
        "type": {"name": <str>, "options": <dict>},
        "name": <str>,
        "not_null": <bool>,
        "default": <any>,
        "delete": <bool>,
        "description": <str>
    }

    Note that keys with empty values will be dropped, unless the given "default"
    key is explicitly set to None.
    """
    DEFAULT_DICT = 'column_default_dict'
    DEFAULT_KEY = 'value'

    column_type = {
        "name": column_data.get('type'),
        "options": column_data.get('type_options')
    }
    new_type = {k: v for k, v in column_type.items() if v} or None
    column_nullable = column_data.get(NULLABLE)
    column_delete = column_data.get("delete")
    column_not_null = not column_nullable if column_nullable is not None else None
    column_name = (column_data.get(NAME) or '').strip() or None
    raw_col_alter_def = {
        "attnum": column_attnum or column_data.get("attnum"),
        "type": new_type,
        "not_null": column_not_null,
        "name": column_name,
        "delete": column_delete,
    }
    col_alter_def = {k: v for k, v in raw_col_alter_def.items() if v is not None}
    # NOTE DESCRIPTION is set separately, because it shouldn't be removed if its
    # value is None (that signals that the description should be removed in the
    # db).
    if DESCRIPTION in column_data:
        column_description = column_data.get(DESCRIPTION)
        col_alter_def[DESCRIPTION] = column_description
    default_dict = column_data.get(DEFAULT_DICT, {})
    if default_dict is not None and DEFAULT_KEY in default_dict:
        default_value = column_data.get(DEFAULT_DICT, {}).get(DEFAULT_KEY)
        col_alter_def.update(default=default_value)
    elif default_dict is None:
        col_alter_def.update(default=None)

    return col_alter_def
