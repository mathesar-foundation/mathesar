import warnings

from pglast import Node, parse_sql
from sqlalchemy import Table, MetaData, and_, select, text, func

from db.columns.exceptions import DynamicDefaultWarning
from db.tables.operations.select import reflect_table_from_oid
from db.utils import execute_statement

# These tags define which nodes in the AST built by pglast we consider to be
# "dynamic" when found in a column default clause.  The nodes are best
# documented by C header files that define the underlying structs:
# https://github.com/pganalyze/libpg_query/blob/13-latest/src/postgres/include/nodes/parsenodes.h
# https://github.com/pganalyze/libpg_query/blob/13-latest/src/postgres/include/nodes/primnodes.h
# It's possible that more dynamic nodes will be found.  Their tags should be
# added to this set.
DYNAMIC_NODE_TAGS = {"SQLValueFunction", "FuncCall"}


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
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attisdropped.is_(True),
            pg_attribute.c.attnum < result,
        ))
    )
    dropped_count = execute_statement(engine, sel, connection_to_use).fetchone()[0]

    return result - 1 - dropped_count


def get_column_indexes_from_table(table_oid, engine, connection_to_use=None):
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_attribute = Table("pg_attribute", MetaData(), autoload_with=engine)
    sel = select(pg_attribute.c.attnum).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attnum > 0,
        )
    )
    results = execute_statement(engine, sel, connection_to_use).fetchall()
    return results


def get_column_name_from_index(table_oid, column_index, engine, connection_to_use=None):
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_attribute = Table("pg_attribute", MetaData(), autoload_with=engine)
    sel = select(pg_attribute.c.attname).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attnum == column_index
        )
    )
    result = execute_statement(engine, sel, connection_to_use).fetchone()[0]
    return result


def get_column_default_dict(table_oid, column_index, engine, connection_to_use=None):
    table = reflect_table_from_oid(table_oid, engine, connection_to_use)
    column = table.columns[column_index]
    default_dict = None
    if column.server_default is not None:
        default_dict = {
            "server_default": column.server_default,
            "is_dynamic": _is_default_expr_dynamic(column.server_default),
            "sql_text": str(column.server_default.arg)
        }
    else:
        return
    if default_dict.get("is_dynamic"):
        warnings.warn(
            "Dynamic column defaults are read only", DynamicDefaultWarning
        )
    else:
        # Defaults are stored as text with SQL casts appended
        # Ex: "'test default string'::character varying" or "'2020-01-01'::date"
        # Here, we execute the cast to get the proper python value
        default_dict.update(
            executed_constant=execute_statement(
                engine,
                select(text(default_dict['sql_text'])),
                connection_to_use
            ).first()[0]
        )
    return default_dict


def get_column_default(table_oid, column_index, engine, connection_to_use=None):
    default_dict = get_column_default_dict(
        table_oid, column_index, engine, connection_to_use=connection_to_use
    )
    if default_dict is None:
        return
    else:
        executed_constant = default_dict.get('executed_constant')

    return executed_constant if executed_constant is not None else default_dict['sql_text']


def _is_default_expr_dynamic(server_default):
    prepared_expr = f"""SELECT {server_default.arg.text};"""
    expr_ast_root = Node(parse_sql(prepared_expr))
    ast_nodes = {
        n.node_tag for n in expr_ast_root.traverse() if isinstance(n, Node)
    }
    return not ast_nodes.isdisjoint(DYNAMIC_NODE_TAGS)
