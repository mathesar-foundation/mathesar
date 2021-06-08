from db.schemas import create_schema, get_schema_oid_from_name
from mathesar.database.base import create_mathesar_engine
from mathesar.models import Schema


def create_schema_and_object(name, database):
    engine = create_mathesar_engine(database)
    create_schema(name, engine)
    schema_oid = get_schema_oid_from_name(name, engine)
    schema = Schema.objects.create(oid=schema_oid, database=database)
    return schema
