import warnings

from pglast import Node, parse_sql
from sqlalchemy import and_, asc, cast, select, text, exists

from db.columns.exceptions import DynamicDefaultWarning
from db.tables.operations.select import reflect_table_from_oid
from db.utils import execute_statement, get_pg_catalog_table

# These tags define which nodes in the AST built by pglast we consider to be
# "dynamic" when found in a column default clause.  The nodes are best
# documented by C header files that define the underlying structs:
# https://github.com/pganalyze/libpg_query/blob/13-latest/src/postgres/include/nodes/parsenodes.h
# https://github.com/pganalyze/libpg_query/blob/13-latest/src/postgres/include/nodes/primnodes.h
# It's possible that more dynamic nodes will be found.  Their tags should be
# added to this set.
DYNAMIC_NODE_TAGS = {"SQLValueFunction", "FuncCall"}


def get_column_attnum_from_names_as_map(table_oid, column_names, engine, metadata, connection_to_use=None):
    statement = _get_columns_attnum_from_names(table_oid, column_names, engine, metadata=metadata)
    attnums_tuple = execute_statement(engine, statement, connection_to_use).fetchall()
    name_attnum_map = {attnum_tuple['attname']: attnum_tuple['attnum'] for attnum_tuple in attnums_tuple}
    return name_attnum_map


def get_columns_attnum_from_names(table_oid, column_names, engine, metadata, connection_to_use=None):
    """
    Returns the respective list of attnum of the column names passed.
     The order is based on the column order in the table and not by the order of the column names argument.
    """
    statement = _get_columns_attnum_from_names(table_oid, column_names, engine=engine, metadata=metadata)
    attnums_tuple = execute_statement(engine, statement, connection_to_use).fetchall()
    attnums = [attnum_tuple[0] for attnum_tuple in attnums_tuple]
    return attnums


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


def get_column_attnums_from_tables(table_oids, engine, metadata, connection_to_use=None):
    pg_attribute = get_pg_catalog_table("pg_attribute", engine, metadata=metadata)
    sel = select(pg_attribute.c.attnum, pg_attribute.c.attrelid.label('table_oid')).where(
        and_(
            pg_attribute.c.attrelid.in_(table_oids),
            # Ignore system columns
            pg_attribute.c.attnum > 0,
            # Ignore removed columns
            pg_attribute.c.attisdropped.is_(False)
        )
    )
    results = execute_statement(engine, sel, connection_to_use).fetchall()
    return results


def get_map_of_attnum_and_table_oid_to_column_name(table_oids, engine, metadata, connection_to_use=None):
    """
    Order determined by the column order in the table.
    """
    triples_of_col_info = _get_triples_of_column_name_and_attnum_and_table_oid(
        table_oids, None, engine, metadata, connection_to_use
    )
    return {
        (attnum, table_oid): column_name
        for column_name, attnum, table_oid
        in triples_of_col_info
    }


def get_column_names_from_attnums(table_oid, attnums, engine, metadata, connection_to_use=None):
    return list(get_map_of_attnum_to_column_name(table_oid, attnums, engine, metadata, connection_to_use).values())


def get_map_of_attnum_to_column_name(table_oid, attnums, engine, metadata, connection_to_use=None):
    """
    Order determined by the column order in the table.
    """
    triples_of_col_info = _get_triples_of_column_name_and_attnum_and_table_oid(
        [table_oid], attnums, engine, metadata, connection_to_use
    )
    return {
        attnum: column_name
        for column_name, attnum, _
        in triples_of_col_info
    }


def _get_triples_of_column_name_and_attnum_and_table_oid(
    table_oids, attnums, engine, metadata, connection_to_use
):
    statement = _statement_for_triples_of_column_name_and_attnum_and_table_oid(
        table_oids, attnums, engine, metadata
    )
    return execute_statement(engine, statement, connection_to_use).fetchall()


def get_column_default(table_oid, attnum, engine, metadata, connection_to_use=None):
    default_dict = get_column_default_dict(
        table_oid,
        attnum,
        engine,
        metadata=metadata,
        connection_to_use=connection_to_use,
    )
    if default_dict is not None:
        return default_dict['value']


def get_column_default_dict(table_oid, attnum, engine, metadata, connection_to_use=None):
    column = get_column_from_oid_and_attnum(
        table_oid=table_oid,
        attnum=attnum,
        engine=engine,
        metadata=metadata,
        connection_to_use=connection_to_use,
    )
    if column.server_default is None:
        return

    is_dynamic = _is_default_expr_dynamic(column.server_default)
    sql_text = str(column.server_default.arg)

    if is_dynamic:
        warnings.warn(
            "Dynamic column defaults are read only", DynamicDefaultWarning
        )
        default_value = sql_text
    else:
        # Defaults are often stored as text with SQL casts appended
        # Ex: "'test default string'::character varying" or "'2020-01-01'::date"
        # Here, we execute the cast to get the proper python value
        default_value = execute_statement(
            engine,
            select(cast(text(sql_text), column.type)),
            connection_to_use
        ).scalar()

    return {"value": default_value, "is_dynamic": is_dynamic}


def determine_whether_column_contains_data(
        table_oid, column_name, engine, metadata, connection_to_use=None
):
    """
    Given a column, return True if it contains data, False otherwise.
    """
    sa_table = reflect_table_from_oid(
        table_oid, engine, metadata=metadata, connection_to_use=connection_to_use,
    )
    sel = select(exists(1).where(sa_table.columns[column_name] != None))  # noqa
    contains_data = execute_statement(engine, sel, connection_to_use).scalar()
    return contains_data


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


def _is_default_expr_dynamic(server_default):
    prepared_expr = f"""SELECT {server_default.arg.text};"""
    expr_ast_root = Node(parse_sql(prepared_expr))
    ast_nodes = {
        n.node_tag for n in expr_ast_root.traverse() if isinstance(n, Node)
    }
    return not ast_nodes.isdisjoint(DYNAMIC_NODE_TAGS)
