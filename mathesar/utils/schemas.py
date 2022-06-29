from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError

from db.schemas.operations.create import create_schema
from db.schemas.utils import get_schema_oid_from_name, get_mathesar_schemas
from mathesar.database.base import create_mathesar_engine
from mathesar.models.base import Schema, Database


def create_schema_and_object(name, database):
    engine = create_mathesar_engine(database)

    all_schemas = get_mathesar_schemas(engine)
    if name in all_schemas:
        raise ValidationError({"name": f"Schema name {name} is not unique"})

    try:
        database_model = Database.objects.get(name=database)
    except ObjectDoesNotExist:
        raise ValidationError({"database": f"Database '{database}' not found"})

    create_schema(name, engine)
    schema_oid = get_schema_oid_from_name(name, engine)

    schema = Schema.objects.create(oid=schema_oid, database=database_model)
    return schema
