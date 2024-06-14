from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError

from db.schemas.operations.create import create_schema_via_sql_alchemy
from db.schemas.utils import get_schema_oid_from_name, get_mathesar_schemas
from mathesar.database.base import create_mathesar_engine
from mathesar.models.base import Schema, Database


def create_schema_and_object(name, connection_id, comment=None):
    try:
        database_model = Database.objects.get(id=connection_id)
        database_name = database_model.name
    except ObjectDoesNotExist:
        raise ValidationError({"database": f"Database '{database_name}' not found"})

    engine = create_mathesar_engine(database_model)

    all_schemas = get_mathesar_schemas(engine)
    if name in all_schemas:
        raise ValidationError({"name": f"Schema name {name} is not unique"})
    create_schema_via_sql_alchemy(name, engine, comment)
    schema_oid = get_schema_oid_from_name(name, engine)

    schema = Schema.objects.create(oid=schema_oid, database=database_model)
    return schema
