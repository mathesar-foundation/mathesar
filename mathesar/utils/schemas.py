from db.schemas import create_schema
from mathesar.database.base import create_mathesar_engine
from mathesar.models import Schema


def create_schema_and_object(name, database):
    engine = create_mathesar_engine(database)
    create_schema(name, engine)
    schema = Schema.objects.create(name=name, database=database)
    return schema
