from sqlalchemy import create_engine, MetaData, Table, DDL
from db import constants
from db.types import email

SCHEMA = f"{constants.MATHESAR_PREFIX}types"
# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
preparer = create_engine("postgresql://").dialect.identifier_preparer


def get_qualified_name(name):
    return ".".join([preparer.quote_schema(SCHEMA), name])


def get_supported_alter_column_types(engine):
    dialect_types = engine.dialect.ischema_names
    type_map = {
        # Default Postgres types
        'float': dialect_types.get('float'),
        'int': dialect_types.get('integer'),
        'integer': dialect_types.get('integer'),
        'json': dialect_types.get('json'),
        'jsonb': dialect_types.get('jsonb'),
        'numeric': dialect_types.get('numeric'),
        'string': dialect_types.get('name'),
        'character varying': dialect_types.get('character varying'),
        'text': dialect_types.get('text'),
        'timestamp': dialect_types.get('timestamp'),
        'uuid': dialect_types.get('timestamp'),
        # Custom Mathesar types
        'email': dialect_types.get(email.QUALIFIED_EMAIL)
    }
    return {k: v for k, v in type_map.items() if v is not None}


def alter_column_type(
        schema, table_name, column_name, target_type_str, engine
):
    _preparer = engine.dialect.identifier_preparer
    supported_types = get_supported_alter_column_types(engine)
    target_type = supported_types.get(target_type_str.lower())
    with engine.begin() as conn:
        metadata = MetaData(bind=engine, schema=schema)
        table = Table(
            table_name, metadata, schema=schema, autoload_with=engine
        )
        column = table.columns[column_name]
        prepared_table_name = _preparer.format_table(table)
        prepared_column_name = _preparer.format_column(column)
        prepared_type_name = target_type().compile(dialect=engine.dialect)
        alter_stmt = f"""
        ALTER TABLE {prepared_table_name}
          ALTER COLUMN {prepared_column_name}
          TYPE {prepared_type_name}
          USING {prepared_column_name}::{prepared_type_name};
        """
        conn.execute(DDL(alter_stmt))
