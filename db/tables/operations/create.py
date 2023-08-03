# from sqlalchemy import Column, TEXT, Table, MetaData
from sqlalchemy.ext import compiler
from sqlalchemy.schema import DDLElement

# from db.columns.utils import init_mathesar_table_column_list_with_defaults
# from db.schemas.operations.create import create_schema
# from db.tables.operations.alter import comment_on_table
import json
from db.connection import execute_msar_func_with_engine
from db.types.base import PostgresType
from db.tables.operations.select import reflect_table_from_oid
from db.metadata import get_empty_metadata


def create_mathesar_table(engine, table_name, schema_oid, columns=[], constraints=[], comment=None):
    # """
    # This method creates a Postgres table in the specified schema using the
    # given name and column list.  It adds internal mathesar columns to the
    # table.
    # """
    # columns = init_mathesar_table_column_list_with_defaults(columns)
    # create_schema(schema, engine, if_not_exists=True)
    # # We need this so that we can create multiple mathesar tables in the
    # # same MetaData, enabling them to reference each other in the
    # # SQLAlchemy context (e.g., for creating a ForeignKey relationship)
    # if metadata is None:
    #     metadata = MetaData(bind=engine, schema=schema)
    # metadata.reflect()
    # # The exception raised by SQLAlchemy upon hitting a duplicate table in the
    # # schema is non-specific.
    # if (name, schema) in [(t.name, t.schema) for t in metadata.sorted_tables]:
    #     raise DuplicateTable
    # table = Table(
    #     name,
    #     metadata,
    #     *columns,
    #     schema=schema
    # )
    # table.create(engine)
    # if comment is not None:  # this check avoids an unneeded DB call
    #     comment_on_table(name, schema, engine, comment)
    # return table
    table_oid = execute_msar_func_with_engine(
        engine,
        'add_mathesar_table',
        schema_oid,
        table_name,
        json.dumps(columns),
        json.dumps(constraints),
        comment
    ).fetchone()[0]
    table = reflect_table_from_oid(table_oid, engine, metadata=get_empty_metadata())
    return table


class DuplicateTable(Exception):
    pass


def create_string_column_table(name, schema_oid, column_names, engine, comment=None):
    """
    This method creates a Postgres table in the specified schema, with all
    columns being String type.
    """
    columns_ = [
        {
            "name": column_name,
            "type": {"name": PostgresType.TEXT.id}
        } for column_name in column_names
    ]
    table_oid = create_mathesar_table(engine, name, schema_oid, columns_, comment=comment)
    table = reflect_table_from_oid(table_oid, engine, metadata=get_empty_metadata())
    return table


class CreateTableAs(DDLElement):
    def __init__(self, name, selectable):
        self.name = name
        self.selectable = selectable


@compiler.compiles(CreateTableAs)
def compile_create_table_as(element, compiler, **_):
    return "CREATE TABLE %s AS (%s)" % (
        element.name,
        compiler.sql_compiler.process(element.selectable, literal_binds=True),
    )
