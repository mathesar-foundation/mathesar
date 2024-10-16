from db.schemas.operations.select import reflect_schema


def get_schema_name_from_oid(oid, engine, metadata=None):
    schema_info = reflect_schema(engine, oid=oid, metadata=metadata)
    if schema_info:
        return schema_info["name"]


def get_schema_oid_from_name(name, engine):
    schema_info = reflect_schema(engine, name=name)
    if schema_info:
        return schema_info["oid"]
