# TODO Move SQLAlchemy-base column attribute getters to separate module
from sqlalchemy import and_, asc, select

from db.connection import exec_msar_func
from db.tables.operations.select import reflect_table_from_oid
from db.deprecated.utils import execute_statement, get_pg_catalog_table


def get_column_info_for_table(table, conn):
    """
    Return a list of dictionaries describing the columns of the table.

    The `table` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    The returned list contains dictionaries of the following form:

        {
            "id": <int>,
            "name": <str>,
            "type": <str>,
            "type_options": {
                "precision": <int>,
                "scale": <int>,
                "fields": <str>,
                "length": <int>,
                "item_type": <str>,
            },
            "nullable": <bool>,
            "primary_key": <bool>,
            "valid_target_types": [<str>, <str>, ..., <str>]
            "default": {"value": <str>, "is_dynamic": <bool>},
            "has_dependents": <bool>,
            "current_role_priv": [<str>, <str>, ...],
            "description": <str>
        }

    The fields of the "type_options" dictionary are all optional,
    depending on the "type" value.

    Args:
        table: The table for which we want column info.
    """
    return exec_msar_func(conn, 'get_column_info', table).fetchone()[0]


def get_column_attnum_from_name(table_oid, column_name, engine, metadata, connection_to_use=None):
    statement = _get_columns_attnum_from_names(table_oid, [column_name], engine=engine, metadata=metadata)
    return execute_statement(engine, statement, connection_to_use).scalar()


def _get_columns_attnum_from_names(table_oid, column_names, engine, metadata):
    pg_attribute = get_pg_catalog_table("pg_attribute", engine=engine, metadata=metadata)
    sel = select(pg_attribute.c.attnum, pg_attribute.c.attname).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname.in_(column_names)
        )
    ).order_by(asc(pg_attribute.c.attnum))
    return sel


def get_column_from_oid_and_attnum(table_oid, attnum, engine, metadata, connection_to_use=None):
    sa_table = reflect_table_from_oid(table_oid, engine, metadata=metadata, connection_to_use=connection_to_use)
    column_name = get_column_name_from_attnum(table_oid, attnum, engine, metadata=metadata, connection_to_use=connection_to_use)
    sa_column = sa_table.columns[column_name]
    return sa_column


def get_column_name_from_attnum(table_oid, attnum, engine, metadata, connection_to_use=None):
    statement = _statement_for_triples_of_column_name_and_attnum_and_table_oid(
        [table_oid], [attnum], engine, metadata=metadata,
    )
    column_name = execute_statement(engine, statement, connection_to_use).scalar()
    return column_name


def _statement_for_triples_of_column_name_and_attnum_and_table_oid(
    table_oids, attnums, engine, metadata
):
    """
    Returns (column name, column attnum, column table's oid) tuples for each column that's in the
    tables specified via `table_oids`, and, when `attnums` is not None, that has an attnum
    specified in `attnums`.

    The order is based on the column order in the table and not on the order of the arguments.
    """
    pg_attribute = get_pg_catalog_table("pg_attribute", engine, metadata=metadata)
    sel = select(pg_attribute.c.attname, pg_attribute.c.attnum, pg_attribute.c.attrelid)
    wasnt_dropped = pg_attribute.c.attisdropped.is_(False)
    table_oid_matches = pg_attribute.c.attrelid.in_(table_oids)
    conditions = [wasnt_dropped, table_oid_matches]
    if attnums is not None:
        attnum_matches = pg_attribute.c.attnum.in_(attnums)
        conditions.append(attnum_matches)
    else:
        attnum_positive = pg_attribute.c.attnum > 0
        conditions.append(attnum_positive)
    sel = sel.where(and_(*conditions))
    return sel
