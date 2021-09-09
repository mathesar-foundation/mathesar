import warnings

from sqlalchemy import Table, MetaData, and_, select, text, func

from db.tables.operations.select import reflect_table_from_oid
from db.utils import execute_statement


def get_column_index_from_name(table_oid, column_name, engine, connection_to_use=None):
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_attribute = Table("pg_attribute", MetaData(), autoload_with=engine)
    sel = select(pg_attribute.c.attnum).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname == column_name
        )
    )
    result = execute_statement(engine, sel, connection_to_use).fetchone()[0]

    # Account for dropped columns that don't appear in the SQLAlchemy tables
    sel = (
        select(func.count())
        .where(and_(
            pg_attribute.c.attisdropped.is_(True),
            pg_attribute.c.attnum < result,
        ))
    )
    dropped_count = execute_statement(engine, sel, connection_to_use).fetchone()[0]

    return result - 1 - dropped_count


def get_column_default(table_oid, column_index, engine, connection_to_use=None):
    table = reflect_table_from_oid(table_oid, engine, connection_to_use)
    column = table.columns[column_index]
    if column.server_default is None:
        return None

    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_attribute = Table("pg_attribute", metadata, autoload_with=engine)
        pg_attrdef = Table("pg_attrdef", metadata, autoload_with=engine)

    query = (
        select(pg_attrdef.c.adbin)
        .select_from(
            pg_attrdef
            .join(
                pg_attribute,
                and_(
                    pg_attribute.c.attnum == pg_attrdef.c.adnum,
                    pg_attribute.c.attrelid == pg_attrdef.c.adrelid
                )
            )
        )
        .where(and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname == column.name,
            pg_attribute.c.attnum >= 1,
        ))
    )

    result = execute_statement(engine, query, connection_to_use).first()[0]

    # Here, we get the 'adbin' value for the current column, stored in the attrdef
    # system table. The prefix of this value tells us whether the default is static
    # ('{CONSTANT') or generated ('{FUNCEXPR'). We do not return generated defaults.
    if result.startswith("{FUNCEXPR"):
        return None

    default_textual_sql = column.server_default.arg.text
    # Defaults are stored as text with SQL casts appended
    # Ex: "'test default string'::character varying" or "'2020-01-01'::date"
    # Here, we execute the cast to get the proper python value
    return execute_statement(engine, select(text(default_textual_sql)), connection_to_use).first()[0]
