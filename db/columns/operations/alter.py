from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import DefaultClause, text, DDL, select
from sqlalchemy.exc import DataError, InternalError, ProgrammingError
from psycopg2.errors import InvalidTextRepresentation, InvalidParameterValue, StringDataRightTruncation, RaiseException, SyntaxError

from db.columns.defaults import NAME, NULLABLE
from db.columns.exceptions import InvalidDefaultError, InvalidTypeError, InvalidTypeOptionError
from db.columns.operations.select import (
    get_column_attnum_from_name, get_column_default, get_column_name_from_attnum,
)
from db.columns.utils import to_mathesar_column_with_engine, get_type_options
from db.tables.operations.select import reflect_table_from_oid
from db.types.operations.convert import get_db_type_enum_from_class, get_db_type_enum_from_id
from db.types.operations.cast import get_cast_function_name
from db.utils import execute_statement
from db.metadata import get_empty_metadata


def alter_column(engine, table_oid, column_attnum, column_data):
    TYPE_KEY = 'type'
    TYPE_OPTIONS_KEY = 'type_options'
    NULLABLE_KEY = NULLABLE
    DEFAULT_DICT = 'column_default_dict'
    DEFAULT_KEY = 'value'
    NAME_KEY = NAME

    with engine.begin() as conn:
        if TYPE_KEY in column_data:
            new_type = get_db_type_enum_from_id(column_data[TYPE_KEY])
            retype_column(
                table_oid, column_attnum, engine, conn,
                new_type=new_type,
                type_options=column_data.get(TYPE_OPTIONS_KEY, {})
            )
        elif TYPE_OPTIONS_KEY in column_data:
            retype_column(
                table_oid, column_attnum, engine, conn,
                type_options=column_data[TYPE_OPTIONS_KEY]
            )

        if NULLABLE_KEY in column_data:
            nullable = column_data[NULLABLE_KEY]
            change_column_nullable(table_oid, column_attnum, engine, conn, nullable)
        if DEFAULT_DICT in column_data:
            default_dict = column_data[DEFAULT_DICT]
            default = default_dict[DEFAULT_KEY] if default_dict is not None else None

            set_column_default(table_oid, column_attnum, engine, conn, default)
        if NAME_KEY in column_data:
            # Name always needs to be the last item altered
            # since previous operations need the name to work
            name = column_data[NAME_KEY]
            rename_column(table_oid, column_attnum, engine, conn, name)
    # TODO reuse metadata
    column_name = get_column_name_from_attnum(table_oid, column_attnum, engine, metadata=get_empty_metadata())
    reflected_table = reflect_table_from_oid(
        table_oid,
        engine,
        # TODO reuse metadata
        metadata=get_empty_metadata(),
    )
    reflected_column = reflected_table.columns[column_name]
    reflected_column = to_mathesar_column_with_engine(
        reflected_column,
        engine,
    )
    return reflected_column


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
        if type(e.orig) == InvalidParameterValue:
            raise InvalidTypeOptionError
        elif type(e.orig) == InvalidTextRepresentation:
            raise InvalidTypeError(column_name, new_type)
        elif type(e.orig) == StringDataRightTruncation:
            raise e.orig
        else:
            raise e.orig
    except InternalError as e:
        if type(e.orig) == RaiseException:
            raise InvalidTypeError(column_name, new_type)
        else:
            raise e.orig
    except ProgrammingError as e:
        if type(e.orig) == SyntaxError:
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


def _validate_columns_for_batch_update(table, column_data):
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
            column_attnum = column_data.get('attnum')
            if column_attnum is not None and column_data.get('delete') is not None:
                name = get_column_name_from_attnum(table_oid, column_attnum, engine=engine, metadata=get_empty_metadata(), connection_to_use=connection)
                batch_op.drop_column(name)


def batch_update_columns(table_oid, engine, column_data_list):
    table = reflect_table_from_oid(
        table_oid,
        engine,
        # TODO reuse metadata
        metadata=get_empty_metadata(),
    )
    _validate_columns_for_batch_update(table, column_data_list)
    with engine.begin() as conn:
        _batch_update_column_types(table_oid, column_data_list, conn, engine)
        _batch_alter_table_rename_columns(table_oid, column_data_list, conn, engine)
        batch_alter_table_drop_columns(table_oid, column_data_list, conn, engine)
