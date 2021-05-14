from sqlalchemy import text
from db.types import base, email

BOOLEAN = "boolean"
EMAIL = email.QUALIFIED_EMAIL
NUMERIC = "numeric"
TEXT = "text"


def install_all_casts(engine):
    create_boolean_casts(engine)
    create_numeric_casts(engine)


def create_boolean_casts(engine):
    not_bool_exception_str = f"RAISE EXCEPTION '% is not a {BOOLEAN}', $1;"
    type_body_map = {
        BOOLEAN: f"""
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
        NUMERIC: f"""
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
