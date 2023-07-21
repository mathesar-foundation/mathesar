import json
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import DefaultClause, text, DDL, select
from sqlalchemy.exc import DataError, InternalError, ProgrammingError
from psycopg.errors import (
    InvalidTextRepresentation, InvalidParameterValue, RaiseException,
    SyntaxError
)
from psycopg2 import errors as ps2err
from db import connection as db_conn
from db.columns.defaults import NAME, NULLABLE
from db.columns.exceptions import InvalidDefaultError, InvalidTypeError, InvalidTypeOptionError
from db.columns.operations.select import (
    get_column_attnum_from_name, get_column_default, get_column_name_from_attnum,
)
from db.columns.utils import get_type_options
from db.tables.operations.select import reflect_table_from_oid
from db.types.operations.convert import get_db_type_enum_from_class, get_db_type_enum_from_id
from db.types.operations.cast import get_cast_function_name
from db.utils import execute_statement
from db.metadata import get_empty_metadata


def alter_column(engine, table_oid, column_attnum, column_data):
    """
    Alter a column of the a table.

    Args:
        table_oid: integer giving the OID of the table with the column.
        column_attnum: integer giving the attnum of the column to alter.
        column_data: dictionary describing the alterations to make.

    column_data should have the form:
    {
        "type": <str>
        "type_options": <dict>,
        "column_default_dict": {"is_dynamic": <bool>, "value": <any>}
        "nullable": <str>,
        "name": <str>
    }
    """
    column_alter_def = _process_column_alter_dict(column_data, column_attnum)
    requested_type = column_alter_def.get("type", {}).get("name")
    try:
        db_conn.execute_msar_func_with_engine(
            engine, 'alter_columns',
            table_oid,
            json.dumps([column_alter_def])
        )
    except InvalidParameterValue:
        raise InvalidTypeOptionError
    except InvalidTextRepresentation:
        column_db_name = db_conn.execute_msar_func_with_engine(
            engine, 'get_column_name', table_oid, column_attnum
        ).fetchone()[0]
        raise InvalidTypeError(column_db_name, requested_type)
    except RaiseException:
        column_db_name = db_conn.execute_msar_func_with_engine(
            engine, 'get_column_name', table_oid, column_attnum
        ).fetchone()[0]
        raise InvalidTypeError(column_db_name, requested_type)
    except SyntaxError:
        raise InvalidTypeOptionError


def retype_column(
    table_oid, column_attnum, engine, connection, new_type=None, type_options=None,
):
    if type_options is None:
        type_options = {}
    table = reflect_table_from_oid(
        table_oid,
        engine,
        connection_to_use=connection,
        # TODO reuse metadata
        metadata=get_empty_metadata(),
    )
    # TODO reuse metadata
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine, metadata=get_empty_metadata())
    column = table.columns[column_name]
    column_db_type = get_db_type_enum_from_class(column.type.__class__)
    new_type = new_type if new_type is not None else column_db_type
    column_type_options = get_type_options(column)

    if (
        new_type == column_db_type
        and _check_type_option_equivalence(type_options, column_type_options)
    ):
        return

    try:
        alter_column_type(
            table_oid,
            column_name,
            engine,
            connection,
            new_type,
            type_options,
        )
    except DataError as e:
        if type(e.orig) == ps2err.InvalidParameterValue:
            raise InvalidTypeOptionError
        elif type(e.orig) == ps2err.InvalidTextRepresentation:
            raise InvalidTypeError(column_name, new_type)
        elif type(e.orig) == ps2err.StringDataRightTruncation:
            raise e.orig
        else:
            raise e.orig
    except InternalError as e:
        if type(e.orig) == ps2err.RaiseException:
            raise InvalidTypeError(column_name, new_type)
        else:
            raise e.orig
    except ProgrammingError as e:
        if type(e.orig) == ps2err.SyntaxError:
            raise InvalidTypeOptionError
        else:
            raise e.orig


def alter_column_type(
    table_oid, column_name, engine, connection, target_type, type_options=None, metadata=None, columns_might_have_defaults=True,
):
    if type_options is None:
        type_options = {}
    metadata = metadata if metadata else get_empty_metadata()
    type_options = type_options if type_options is not None else {}
    _preparer = engine.dialect.identifier_preparer
    table = reflect_table_from_oid(
        table_oid,
        engine,
        connection_to_use=connection,
        metadata=metadata,
    )
    column = table.columns[column_name]
    column_attnum = get_column_attnum_from_name(table_oid, column_name, engine=engine, metadata=metadata, connection_to_use=connection)

    if columns_might_have_defaults:
        default = get_column_default(table_oid, column_attnum, engine=engine, metadata=metadata, connection_to_use=connection)
        if default is not None:
            default_text = column.server_default.arg.text
        set_column_default(table_oid, column_attnum, engine, connection, None, metadata=metadata)

    prepared_table_name = _preparer.format_table(table)
    prepared_column_name = _preparer.format_column(column)
    prepared_type_name = target_type.get_sa_instance_compiled(
        engine=engine,
        type_options=type_options
    )
    cast_function_name = get_cast_function_name(target_type)
    alter_stmt = f"""
    ALTER TABLE {prepared_table_name}
      ALTER COLUMN {prepared_column_name}
      TYPE {prepared_type_name}
      USING {cast_function_name}({prepared_column_name});
    """

    execute_statement(engine, DDL(alter_stmt), connection)

    if columns_might_have_defaults:
        if default is not None:
            cast_stmt = f"{cast_function_name}({default_text})"
            default_stmt = select(text(cast_stmt))
            new_default = str(execute_statement(engine, default_stmt, connection).first()[0])
            set_column_default(table_oid, column_attnum, engine, connection, new_default)


def change_column_nullable(table_oid, column_attnum, engine, connection, nullable):
    table = reflect_table_from_oid(
        table_oid,
        engine,
        connection_to_use=connection,
        # TODO reuse metadata
        metadata=get_empty_metadata(),
    )
    # TODO reuse metadata
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine, metadata=get_empty_metadata())
    column = table.columns[column_name]
    ctx = MigrationContext.configure(connection)
    op = Operations(ctx)
    op.alter_column(table.name, column.name, nullable=nullable, schema=table.schema)


def set_column_default(table_oid, column_attnum, engine, connection, default, metadata=None):
    metadata = metadata if metadata else get_empty_metadata()
    table = reflect_table_from_oid(
        table_oid,
        engine,
        connection_to_use=connection,
        metadata=metadata,
    )
    # TODO reuse metadata
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine, metadata=metadata)
    default_clause = DefaultClause(str(default)) if default is not None else default
    try:
        ctx = MigrationContext.configure(connection)
        op = Operations(ctx)
        op.alter_column(table.name, column_name, schema=table.schema, server_default=default_clause)
    except DataError as e:
        if (type(e.orig) == InvalidTextRepresentation):
            raise InvalidDefaultError
        else:
            raise e


def rename_column(table_oid, column_attnum, engine, connection, new_name):
    table = reflect_table_from_oid(
        table_oid,
        engine,
        connection_to_use=connection,
        # TODO reuse metadata
        metadata=get_empty_metadata(),
    )
    # TODO reuse metadata
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine=engine, metadata=get_empty_metadata())
    column = table.columns[column_name]
    ctx = MigrationContext.configure(connection)
    op = Operations(ctx)
    op.alter_column(table.name, column.name, new_column_name=new_name, schema=table.schema)


def _check_type_option_equivalence(type_options_1, type_options_2):
    NULL_OPTIONS = [None, {}]
    if type_options_1 in NULL_OPTIONS and type_options_2 in NULL_OPTIONS:
        return True
    elif type_options_1 == type_options_2:
        return True
    return False


def _validate_columns_for_batch_update(column_data):
    ALLOWED_KEYS = ['attnum', 'name', 'type', 'type_options', 'delete']
    for single_column_data in column_data:
        if 'attnum' not in single_column_data.keys():
            raise ValueError('Key "attnum" is required')
        for key in single_column_data.keys():
            if key not in ALLOWED_KEYS:
                allowed_key_list = ', '.join(ALLOWED_KEYS)
                raise ValueError(f'Key "{key}" found in columns. Keys allowed are: {allowed_key_list}')


def _batch_update_column_types(table_oid, column_data_list, connection, engine):
    for column_data in column_data_list:
        column_attnum = column_data.get('attnum')
        if 'type' in column_data and column_attnum is not None:
            new_type = get_db_type_enum_from_id(column_data['type'])
            type_options = column_data.get('type_options', {})
            if type_options is None:
                type_options = {}
            retype_column(table_oid, column_attnum, engine, connection, new_type, type_options)


def _batch_alter_table_rename_columns(table_oid, column_data_list, connection, engine):
    table = reflect_table_from_oid(
        table_oid,
        engine,
        connection_to_use=connection,
        # TODO reuse metadata
        metadata=get_empty_metadata(),
    )
    ctx = MigrationContext.configure(connection)
    op = Operations(ctx)
    with op.batch_alter_table(table.name, schema=table.schema) as batch_op:
        for column_data in column_data_list:
            column_attnum = column_data.get('attnum', None)
            if column_attnum is not None:
                # TODO reuse metadata
                name = get_column_name_from_attnum(table_oid, column_attnum, engine=engine, metadata=get_empty_metadata(), connection_to_use=connection)
            # TODO seems like name can be unbound below; improve logic/structure
            #   Brent's explanation (copy-pasted from GH review):
            #   I think there's a problem here, but it would only happen if this function is called
            #   without an attnum for some passed column data blob, which should never happen.
            if 'name' in column_data and name != column_data['name']:
                batch_op.alter_column(
                    name,
                    new_column_name=column_data['name']
                )


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
        "delete": <bool>
    }

    Output form:
    {
        "type": {"name": <str>, "options": <dict>},
        "name": <str>,
        "not_null": <bool>,
        "default": <any>,
        "delete": <bool>
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
        "delete": column_delete
    }
    col_alter_def = {k: v for k, v in raw_col_alter_def.items() if v is not None}
    default_dict = column_data.get(DEFAULT_DICT, {})
    if default_dict is not None and DEFAULT_KEY in default_dict:
        default_value = column_data.get(DEFAULT_DICT, {}).get(DEFAULT_KEY)
        col_alter_def.update(default=default_value)
    elif default_dict is None:
        col_alter_def.update(default=None)

    return col_alter_def
