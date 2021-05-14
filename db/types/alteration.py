from sqlalchemy import text, DDL, MetaData, Table
from db.types import base, email

BOOLEAN = "boolean"
EMAIL = email.QUALIFIED_EMAIL
INTERVAL = "interval"
NUMERIC = "numeric"
TEXT = "text"
VARCHAR = "varchar"


def get_supported_alter_column_types(engine):
    dialect_types = engine.dialect.ischema_names
    type_map = {
        # Default Postgres types
        "boolean": dialect_types.get("boolean"),
        "interval": dialect_types.get("interval"),
        "numeric": dialect_types.get("numeric"),
        "string": dialect_types.get("name"),
        # Custom Mathesar types
        "email": dialect_types.get(email.QUALIFIED_EMAIL)
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
        cast_function_name = get_cast_function_name(prepared_type_name)
        alter_stmt = f"""
        ALTER TABLE {prepared_table_name}
          ALTER COLUMN {prepared_column_name}
          TYPE {prepared_type_name}
          USING {cast_function_name}({prepared_column_name});
        """
        conn.execute(DDL(alter_stmt))


def install_all_casts(engine):
    create_boolean_casts(engine)
    create_email_casts(engine)
    create_interval_casts(engine)
    create_numeric_casts(engine)
    create_varchar_casts(engine)


def create_boolean_casts(engine):
    not_bool_exception_str = f"RAISE EXCEPTION '% is not a {BOOLEAN}', $1;"
    type_body_map = {
        BOOLEAN: """
        BEGIN
          RETURN $1;
        END;
        """,
        TEXT: f"""
        DECLARE
        istrue {BOOLEAN};
        BEGIN
          SELECT lower($1)='t' OR lower($1)='true' INTO istrue;
          IF istrue OR lower($1)='f' OR lower($1)='false' THEN
            RETURN istrue;
          END IF;
          {not_bool_exception_str}
        END;
        """,
        NUMERIC: f"""
        BEGIN
          IF $1<>0 AND $1<>1 THEN
            {not_bool_exception_str}
          END IF;
          RETURN $1<>0;
        END;
        """,
    }
    create_cast_functions(BOOLEAN, type_body_map, engine)


def create_numeric_casts(engine):
    type_body_map = {
        NUMERIC: """
        BEGIN
          RETURN $1;
        END;
        """,
        BOOLEAN: f"""
        BEGIN
          IF $1 THEN
            RETURN 1::{NUMERIC};
          END IF;
          RETURN 0;
        END;
        """,
        TEXT: f"""
        BEGIN
          RETURN $1::{NUMERIC};
        END;
        """,
    }
    create_cast_functions(NUMERIC, type_body_map, engine)


def create_email_casts(engine):
    type_body_map = {
        EMAIL: """
        BEGIN
          RETURN $1;
        END;
        """,
        TEXT: f"""
        BEGIN
          RETURN $1::{EMAIL};
        END;
        """,
    }
    create_cast_functions(EMAIL, type_body_map, engine)


def create_interval_casts(engine):
    type_body_map = {
        INTERVAL: """
        BEGIN
          RETURN $1;
        END;
        """,
        TEXT: f"""
        BEGIN
          RETURN $1::{INTERVAL};
        END;
        """,
    }
    create_cast_functions(INTERVAL, type_body_map, engine)


def create_varchar_casts(engine):
    type_body_map = {
        VARCHAR: """
        BEGIN
          RETURN $1;
        END;
        """,
        BOOLEAN: f"""
        BEGIN
          RETURN $1::{VARCHAR};
        END;
        """,
        EMAIL: f"""
        BEGIN
          RETURN $1::{VARCHAR};
        END;
        """,
        INTERVAL: f"""
        BEGIN
          RETURN $1::{VARCHAR};
        END;
        """,
        NUMERIC: f"""
        BEGIN
          RETURN $1::{VARCHAR};
        END;
        """,
        TEXT: f"""
        BEGIN
          RETURN $1::{VARCHAR};
        END;
        """,
    }
    create_cast_functions(VARCHAR, type_body_map, engine)


def create_cast_functions(target_type, type_body_map, engine):
    for type_, body in type_body_map.items():
        query = assemble_function_creation_sql(type_, target_type, body)
        with engine.begin() as conn:
            conn.execute(text(query))


def assemble_function_creation_sql(argument_type, target_type, function_body):
    function_name = get_cast_function_name(target_type)
    return f"""
    CREATE OR REPLACE FUNCTION {function_name}({argument_type})
    RETURNS {target_type}
    AS $$
    {function_body}
    $$ LANGUAGE plpgsql;
    """


def get_cast_function_name(target_type):
    unqualified_type_name = target_type.split('.')[-1].lower()
    bare_function_name = f"cast_to_{unqualified_type_name}"
    return f"{base.get_qualified_name(bare_function_name)}"
