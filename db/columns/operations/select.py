import warnings

from pglast import Node, parse_sql
from sqlalchemy import and_, asc, cast, select, text

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


def _get_columns_attnum_from_names(table_oid, column_names, engine):
    pg_attribute = get_pg_catalog_table("pg_attribute", engine)
    sel = select(pg_attribute.c.attnum, pg_attribute.c.attname).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname.in_(column_names)
        )
    ).order_by(asc(pg_attribute.c.attnum))
    return sel


def get_columns_attnum_from_names(table_oid, column_names, engine, connection_to_use=None, return_as_name_map=False):
    """
    Returns the respective list of attnum of the column names passed.
     The order is based on the column order in the table and not by the order of the column names argument.
    """
    statement = _get_columns_attnum_from_names(table_oid, column_names, engine)
    attnums_tuple = execute_statement(engine, statement, connection_to_use).fetchall()
    if return_as_name_map:
        name_attnum_map = {attnum_tuple[1]: attnum_tuple[0] for attnum_tuple in attnums_tuple}
        return name_attnum_map
    else:
        attnums = [attnum_tuple[0] for attnum_tuple in attnums_tuple]
        return attnums


def get_column_attnum_from_name(table_oid, column_name, engine, connection_to_use=None):
    statement = _get_columns_attnum_from_names(table_oid, [column_name], engine)
    return execute_statement(engine, statement, connection_to_use).scalar()


def get_column_attnums_from_table(table_oid, engine, connection_to_use=None):
    pg_attribute = get_pg_catalog_table("pg_attribute", engine)
    sel = select(pg_attribute.c.attnum).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            # Ignore system columns
            pg_attribute.c.attnum > 0,
            # Ignore removed columns
            pg_attribute.c.attisdropped.is_(False)
        )
    )
    results = execute_statement(engine, sel, connection_to_use).fetchall()
    return results


def _get_columns_name_from_attnums(table_oids, attnums, engine, connection_to_use=None):
    pg_attribute = get_pg_catalog_table("pg_attribute", engine)
    sel = select(pg_attribute.c.attname, pg_attribute.c.attnum, pg_attribute.c.attrelid)
    conditions = [pg_attribute.c.attrelid.in_(table_oids)]
    if attnums is not None:
        conditions.append(pg_attribute.c.attnum.in_(attnums))
    else:
        conditions.extend([pg_attribute.c.attisdropped.is_(False), pg_attribute.c.attnum > 0])
    sel = sel.where(and_(*conditions))
    return sel


def get_columns_name_from_tables(table_oids, engine, connection_to_use=None, fetch_as_map=False):
    """
    Returns the respective list of attnum of the column names passed.
     The order is based on the column order in the table and not by the order of the column names argument.
    """
    statement = _get_columns_name_from_attnums(table_oids, None, engine, connection_to_use=None)
    column_names_tuple = execute_statement(engine, statement, connection_to_use).fetchall()
    if fetch_as_map:
        column_names = {(column_name_tuple[1], column_name_tuple[2]): column_name_tuple[0] for column_name_tuple in column_names_tuple}
    else:
        column_names = [column_name_tuple[0] for column_name_tuple in column_names_tuple]
    return column_names


def get_columns_name_from_attnums(table_oid, attnums, engine, connection_to_use=None):
    """
    Returns the respective list of attnum of the column names passed.
     The order is based on the column order in the table and not by the order of the column names argument.
    """
    statement = _get_columns_name_from_attnums([table_oid], attnums, engine, connection_to_use=None)
    column_names_tuple = execute_statement(engine, statement, connection_to_use).fetchall()
    column_names = [column_name_tuple[0] for column_name_tuple in column_names_tuple]
    return column_names


def get_column_name_from_attnum(table_oid, attnum, engine, connection_to_use=None):
    statement = _get_columns_name_from_attnums([table_oid], [attnum], engine, connection_to_use=None)
    return execute_statement(engine, statement, connection_to_use).scalar()


def get_column_default_dict(table_oid, attnum, engine, connection_to_use=None):
    table = reflect_table_from_oid(table_oid, engine, connection_to_use=connection_to_use)
    column_name = get_column_name_from_attnum(table_oid, attnum, engine, connection_to_use)
    column = table.columns[column_name]
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


def get_column_default(table_oid, attnum, engine, connection_to_use=None):
    default_dict = get_column_default_dict(
        table_oid, attnum, engine, connection_to_use=connection_to_use
    )
    if default_dict is not None:
        return default_dict['value']


def _is_default_expr_dynamic(server_default):
    prepared_expr = f"""SELECT {server_default.arg.text};"""
    expr_ast_root = Node(parse_sql(prepared_expr))
    ast_nodes = {
        n.node_tag for n in expr_ast_root.traverse() if isinstance(n, Node)
    }
    return not ast_nodes.isdisjoint(DYNAMIC_NODE_TAGS)
