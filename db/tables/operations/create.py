from sqlalchemy import Column, TEXT, Table, MetaData
from sqlalchemy.ext import compiler
from sqlalchemy.schema import DDLElement

from db.columns.utils import init_mathesar_table_column_list_with_defaults
from db.schemas.operations.create import create_schema


def create_mathesar_table(name, schema, columns, engine, metadata=None):
    """
    This method creates a Postgres table in the specified schema using the
    given name and column list.  It adds internal mathesar columns to the
    table.
    """
    columns = init_mathesar_table_column_list_with_defaults(columns)
    create_schema(schema, engine)
    # We need this so that we can create multiple mathesar tables in the
    # same MetaData, enabling them to reference each other in the
    # SQLAlchemy context (e.g., for creating a ForeignKey relationship)
    if metadata is None:
        metadata = MetaData(bind=engine, schema=schema)
    table = Table(
        name,
        metadata,
        *columns,
        schema=schema
    )
    table.create(engine)
    return table


def create_string_column_table(name, schema, column_names, engine):
    """
    This method creates a Postgres table in the specified schema, with all
    columns being String type.
    """
    columns_ = [Column(name=column_name, type_=TEXT) for column_name in column_names]
    table = create_mathesar_table(name, schema, columns_, engine)
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
