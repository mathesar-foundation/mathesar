from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import DefaultClause, text, DDL, select
from sqlalchemy.exc import DataError, InternalError
from psycopg2.errors import InvalidTextRepresentation, InvalidParameterValue

from db.columns.defaults import NAME, NULLABLE
from db.columns.exceptions import InvalidDefaultError, InvalidTypeError, InvalidTypeOptionError
from db.columns.operations.select import get_column_default, get_column_index_from_name
from db.columns.utils import get_mathesar_column_with_engine, get_type_options
from db.tables.operations.select import get_oid_from_table, reflect_table_from_oid
from db.types.base import get_db_type_name
from db.types.operations.cast import get_supported_alter_column_types, get_cast_function_name
from db.utils import execute_statement


def alter_column(engine, table_oid, column_index, column_data):
    TYPE_KEY = 'plain_type'
    TYPE_OPTIONS_KEY = 'type_options'
    NULLABLE_KEY = NULLABLE
    DEFAULT_DICT = 'column_default_dict'
    DEFAULT_KEY = 'value'
    NAME_KEY = NAME

    table = reflect_table_from_oid(table_oid, engine)
    column_index = int(column_index)

    with engine.begin() as conn:
        if TYPE_KEY in column_data:
            retype_column(
                table, column_index, engine, conn,
                new_type=column_data[TYPE_KEY],
                type_options=column_data.get(TYPE_OPTIONS_KEY, {})
            )
        elif TYPE_OPTIONS_KEY in column_data:
            retype_column(
                table, column_index, engine, conn,
                type_options=column_data[TYPE_OPTIONS_KEY]
            )

        if NULLABLE_KEY in column_data:
            nullable = column_data[NULLABLE_KEY]
            change_column_nullable(table, column_index, engine, conn, nullable)
        if DEFAULT_DICT in column_data:
            default_dict = column_data[DEFAULT_DICT]
            default = default_dict[DEFAULT_KEY] if default_dict is not None else None
            set_column_default(table, column_index, engine, conn, default)
        if NAME_KEY in column_data:
            # Name always needs to be the last item altered
            # since previous operations need the name to work
            name = column_data[NAME_KEY]
            rename_column(table, column_index, engine, conn, name)

    return get_mathesar_column_with_engine(
        reflect_table_from_oid(table_oid, engine).columns[column_index],
        engine
    )


def alter_column_type(
        table, column_name, engine, connection, target_type_str,
        type_options={}, friendly_names=True,
):
    _preparer = engine.dialect.identifier_preparer
    supported_types = get_supported_alter_column_types(
        engine, friendly_names=friendly_names
    )
    target_type = supported_types.get(target_type_str)
    schema = table.schema

    table_oid = get_oid_from_table(table.name, schema, engine)
    # Re-reflect table so that column is accurate
    table = reflect_table_from_oid(table_oid, engine, connection)
    column = table.columns[column_name]
    column_index = get_column_index_from_name(table_oid, column_name, engine, connection)

    default = get_column_default(table_oid, column_index, engine, connection)
    if default is not None:
        default_text = column.server_default.arg.text
    set_column_default(table, column_index, engine, connection, None)

    prepared_table_name = _preparer.format_table(table)
    prepared_column_name = _preparer.format_column(column)
    prepared_type_name = target_type(**type_options).compile(dialect=engine.dialect)
    cast_function_name = get_cast_function_name(prepared_type_name)
    alter_stmt = f"""
    ALTER TABLE {prepared_table_name}
      ALTER COLUMN {prepared_column_name}
      TYPE {prepared_type_name}
      USING {cast_function_name}({prepared_column_name});
    """

    execute_statement(engine, DDL(alter_stmt), connection)

    if default is not None:
        cast_stmt = f"{cast_function_name}({default_text})"
        default_stmt = select(text(cast_stmt))
        new_default = str(execute_statement(engine, default_stmt, connection).first()[0])
        set_column_default(table, column_index, engine, connection, new_default)


def retype_column(
        table, column_index, engine, connection, new_type=None, type_options={},
):
    column = table.columns[column_index]
    column_db_type = get_db_type_name(column.type, engine)
    new_type = new_type if new_type is not None else column_db_type
    column_type_options = get_type_options(column)

    if (
            (new_type.lower() == column_db_type.lower())
            and _check_type_option_equivalence(type_options, column_type_options)
    ):
        return

    try:
        alter_column_type(
            table,
            table.columns[column_index].name,
            engine,
            connection,
            new_type,
            type_options,
            friendly_names=False
        )
    except DataError as e:
        if type(e.orig) == InvalidParameterValue:
            raise InvalidTypeOptionError
        if type(e.orig) == InvalidTextRepresentation:
            raise InvalidTypeError
        else:
            raise e
    except InternalError as e:
        raise e.orig


def change_column_nullable(table, column_index, engine, connection, nullable):
    column = table.columns[column_index]
    ctx = MigrationContext.configure(connection)
    op = Operations(ctx)
    op.alter_column(table.name, column.name, nullable=nullable, schema=table.schema)


def set_column_default(table, column_index, engine, connection, default):
    column = table.columns[column_index]
    default_clause = DefaultClause(str(default)) if default is not None else default
    try:
        ctx = MigrationContext.configure(connection)
        op = Operations(ctx)
        op.alter_column(table.name, column.name, schema=table.schema, server_default=default_clause)
    except DataError as e:
        if (type(e.orig) == InvalidTextRepresentation):
            raise InvalidDefaultError
        else:
            raise e


def rename_column(table, column_index, engine, connection, new_name):
    column = table.columns[column_index]
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
    ALLOWED_KEYS = ['name', 'plain_type', 'type_options']
    if len(column_data) != len(table.columns):
        raise ValueError('Number of columns passed in must equal number of columns in table')
    for single_column_data in column_data:
        for key in single_column_data.keys():
            if key not in ALLOWED_KEYS:
                allowed_key_list = ', '.join(ALLOWED_KEYS)
                raise ValueError(f'Key "{key}" found in columns. Keys allowed are: {allowed_key_list}')


def _batch_update_column_types(table, column_data_list, connection, engine):
    for index, column_data in enumerate(column_data_list):
        if 'plain_type' in column_data:
            new_type = column_data['plain_type']
            type_options = column_data.get('type_options', {})
            if type_options is None:
                type_options = {}
            retype_column(table, index, engine, connection, new_type, type_options)


def _batch_alter_table_columns(table, column_data_list, connection):
    ctx = MigrationContext.configure(connection)
    op = Operations(ctx)
    with op.batch_alter_table(table.name, schema=table.schema) as batch_op:
        for index, column_data in enumerate(column_data_list):
            column = table.columns[index]
            if 'name' in column_data and column.name != column_data['name']:
                batch_op.alter_column(
                    column.name,
                    new_column_name=column_data['name']
                )
            elif len(column_data.keys()) == 0:
                batch_op.drop_column(column.name)


def batch_update_columns(table_oid, engine, column_data_list):
    table = reflect_table_from_oid(table_oid, engine)
    _validate_columns_for_batch_update(table, column_data_list)
    with engine.begin() as conn:
        _batch_update_column_types(table, column_data_list, conn, engine)
        _batch_alter_table_columns(table, column_data_list, conn)
