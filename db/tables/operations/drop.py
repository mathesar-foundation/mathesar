from sqlalchemy.schema import DropTable
from sqlalchemy.ext import compiler
from sqlalchemy.exc import NoSuchTableError, InternalError
from psycopg2.errors import DependentObjectsStillExist

from db.tables.operations.select import reflect_table
from db.metadata import get_empty_metadata


class DropTableCascade(DropTable):
    def __init__(self, table, cascade=False, if_exists=False, **kwargs):
        super().__init__(table, if_exists=if_exists, **kwargs)
        self.cascade = cascade


@compiler.compiles(DropTableCascade, "postgresql")
def compile_drop_table(element, compiler, **_):
    expression = compiler.visit_drop_table(element)
    if element.cascade:
        return expression + " CASCADE"
    else:
        return expression


def drop_table(name, schema, engine, cascade=False, if_exists=False):
    try:
        # TODO reuse metadata
        table = reflect_table(name, schema, engine, metadata=get_empty_metadata())
    except NoSuchTableError:
        if if_exists:
            return
        else:
            raise
    with engine.begin() as conn:
        try:
            conn.execute(DropTableCascade(table, cascade=cascade))
        except InternalError as e:
            if isinstance(e.orig, DependentObjectsStillExist):
                raise e.orig
            else:
                raise e
