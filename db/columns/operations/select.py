import warnings

from pglast import Node, parse_sql
from sqlalchemy import Table, MetaData, and_, select, text, func

from db.columns.exceptions import DynamicDefaultWarning
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
            pg_attribute.c.attrelid == table_oid,
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
    elif _is_default_expr_dynamic(column.server_default):
        warnings.warn(
            "Dynamic column defaults are not implemented", DynamicDefaultWarning
        )
        return str(column.server_default.arg)

    default_textual_sql = str(column.server_default.arg)
    # Defaults are stored as text with SQL casts appended
    # Ex: "'test default string'::character varying" or "'2020-01-01'::date"
    # Here, we execute the cast to get the proper python value
    return execute_statement(engine, select(text(default_textual_sql)), connection_to_use).first()[0]


def _is_default_expr_dynamic(server_default):
    prepared_expr = f"""SELECT {server_default.arg.text};"""
    expr_ast_root = Node(parse_sql(prepared_expr))
    ast_nodes = {
        n.node_tag for n in expr_ast_root.traverse() if isinstance(n, Node)
    }
    dynamic_node_tags = {"SQLValueFunction", "FuncCall"}
    return not ast_nodes.isdisjoint(dynamic_node_tags)
