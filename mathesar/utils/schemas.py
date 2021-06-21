from rest_framework.exceptions import ValidationError

from db.schemas import (
    create_schema, get_schema_oid_from_name, get_mathesar_schemas,
    get_mathesar_schemas_with_oids
)
from mathesar.database.base import create_mathesar_engine
from mathesar.models import Schema


def create_schema_and_object(name, database):
    engine = create_mathesar_engine(database)

    all_schemas = get_mathesar_schemas(engine)
    if name in all_schemas:
        raise ValidationError({"name": "Schema name is not unique"})

    create_schema(name, engine)
    schema_oid = get_schema_oid_from_name(name, engine)
    schema = Schema.objects.create(oid=schema_oid, database=database)
    return schema


def reflect_schemas_from_database(database):
    engine = create_mathesar_engine(database)
    db_schema_oids = {
        schema["oid"] for schema in get_mathesar_schemas_with_oids(engine)
    }
    schemas = [
        Schema.objects.get_or_create(oid=oid, database=database)
        for oid in db_schema_oids
    ]
    for schema in Schema.objects.all():
        if schema.oid not in db_schema_oids:
            schema.delete()
    return schemas
