from psycopg2.errors import DependentObjectsStillExist
from sqlalchemy.schema import DropSchema
from sqlalchemy.exc import InternalError

from db.schemas.utils import get_all_schemas


def drop_schema(schema, engine, cascade=False, if_exists=False):
    """
    This method deletes a Postgres schema.
    """
    if if_exists and schema not in get_all_schemas(engine):
        return

    with engine.begin() as connection:
        try:
            connection.execute(DropSchema(schema, cascade=cascade))
        except InternalError as e:
            if isinstance(e.orig, DependentObjectsStillExist):
                raise e.orig
            else:
                raise e
