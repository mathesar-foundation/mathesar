from sqlalchemy.schema import DDLElement
from sqlalchemy.ext import compiler


SUPPORTED_SCHEMA_ALTER_ARGS = {'name'}


class RenameSchema(DDLElement):
    def __init__(self, schema, rename_to):
        self.schema = schema
        self.rename_to = rename_to


@compiler.compiles(RenameSchema)
def compile_rename_schema(element, compiler, **_):
    return 'ALTER SCHEMA "%s" RENAME TO "%s"' % (
        element.schema,
        element.rename_to
    )


def rename_schema(schema, engine, rename_to):
    """
    This method renames a Postgres schema.
    """
    if rename_to == schema:
        return
    with engine.begin() as connection:
        connection.execute(RenameSchema(schema, rename_to))


def alter_schema(name, engine, update_data):
    if "name" in update_data:
        rename_schema(name, engine, update_data["name"])
