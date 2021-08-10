from sqlalchemy import text, DDL, MetaData, Table
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import Function
from db.types import base, email

BOOLEAN = "boolean"
EMAIL = "email"
DECIMAL = "decimal"
DOUBLE_PRECISION = "double precision"
FLOAT = "float"
INTEGER = "integer"
INTERVAL = "interval"
NAME = "name"
NUMERIC = "numeric"
REAL = "real"
STRING = "string"
VARCHAR = "varchar"
FULL_VARCHAR = "character varying"


class UnsupportedTypeException(Exception):
    pass


def get_supported_alter_column_types(engine, friendly_names=True):
    """
    Returns a list of valid types supported by mathesar for the given engine.

    engine:  This should be an engine connecting to the DB where we want
    to inspect the installed types.
    friendly_names: sets whether to use "friendly" service-layer or the
    actual DB-layer names.
    """
    dialect_types = engine.dialect.ischema_names
    friendly_type_map = {
        # Default Postgres types
        BOOLEAN: dialect_types.get(BOOLEAN),
        DECIMAL: dialect_types.get(DECIMAL),
        DOUBLE_PRECISION: dialect_types.get(DOUBLE_PRECISION),
        FLOAT: dialect_types.get(FLOAT),
        INTEGER: dialect_types.get(INTEGER),
        INTERVAL: dialect_types.get(INTERVAL),
        NUMERIC: dialect_types.get(NUMERIC),
        REAL: dialect_types.get(REAL),
        STRING: dialect_types.get(NAME),
        VARCHAR: dialect_types.get(FULL_VARCHAR),
        # Custom Mathesar types
        EMAIL: dialect_types.get(email.QUALIFIED_EMAIL)
    }
    if friendly_names:
        type_map = {k: v for k, v in friendly_type_map.items() if v is not None}
    else:
        type_map = {
            val().compile(dialect=engine.dialect): val
            for val in friendly_type_map.values()
            if val is not None
        }
    return type_map


def get_supported_alter_column_db_types(engine):
    return set(
        [
            type_().compile(dialect=engine.dialect)
            for type_ in get_supported_alter_column_types(engine).values()
        ]
    )


def get_robust_supported_alter_column_type_map(engine):
    supported_types = get_supported_alter_column_types(engine, friendly_names=True)
    supported_types.update(get_supported_alter_column_types(engine, friendly_names=False))
    supported_types.update(
        {
            type_.lower(): supported_types[type_] for type_ in supported_types
        } | {

            type_.upper(): supported_types[type_] for type_ in supported_types
        }
    )
    return supported_types


def alter_column_type(
        schema,
        table_name,
        column_name,
        target_type_str,
        engine,
        friendly_names=True,
        type_options={},
):
    _preparer = engine.dialect.identifier_preparer
    supported_types = get_supported_alter_column_types(
        engine, friendly_names=friendly_names
    )
    target_type = supported_types.get(target_type_str)

    with engine.begin() as conn:
        metadata = MetaData(bind=engine, schema=schema)
        table = Table(
            table_name, metadata, schema=schema, autoload_with=engine
        )
        column = table.columns[column_name]
        prepared_table_name = _preparer.format_table(table)
        prepared_column_name = _preparer.format_column(column)
        prepared_type_name = target_type(**type_options).compile(dialect=engine.dialect)
        cast_function_name = get_cast_function_name(prepared_type_name)
        alter_stmt = f"""
        ALTER TABLE {prepared_table_name}
          ALTER COLUMN {prepared_column_name}
          TYPE {prepared_type_name}
          USING {cast_function_name}({prepared_column_name});
        """
        conn.execute(DDL(alter_stmt))


def get_column_cast_expression(column, target_type_str, engine, type_options={}):
    """
    Given a Column, we get the correct SQL selectable for selecting the
    results of a Mathesar cast_to_<type> function on that column, where
    <type> is derived from the target_type_str.
    """
    target_type = get_robust_supported_alter_column_type_map(engine).get(target_type_str)
    if target_type is None:
        raise UnsupportedTypeException(
            f"Target Type '{target_type_str}' is not supported."
        )
    else:
        prepared_target_type_name = target_type().compile(dialect=engine.dialect)

    if prepared_target_type_name == column.type.__class__().compile(dialect=engine.dialect):
        cast_expr = column
    else:
        qualified_function_name = get_cast_function_name(prepared_target_type_name)
        cast_expr = Function(
            quoted_name(qualified_function_name, False),
            column
        )
    if type_options:
        cast_expr = cast_expr.cast(target_type(**type_options))
    return cast_expr


def install_all_casts(engine):
    create_boolean_casts(engine)
    create_email_casts(engine)
    create_floating_point_casts(engine)
    create_integer_casts(engine)
    create_interval_casts(engine)
    create_decimal_numeric_casts(engine)
    create_varchar_casts(engine)


def create_boolean_casts(engine):
    type_body_map = _get_boolean_type_body_map()
    create_cast_functions(BOOLEAN, type_body_map, engine)


def create_email_casts(engine):
    type_body_map = _get_email_type_body_map()
    create_cast_functions(email.QUALIFIED_EMAIL, type_body_map, engine)


def create_floating_point_casts(engine):
    floating_point_types = [DOUBLE_PRECISION, FLOAT, REAL]
    for type_str in floating_point_types:
        type_body_map = _get_float_type_body_map(target_type_str=type_str)
        create_cast_functions(type_str, type_body_map, engine)


def create_integer_casts(engine):
    type_body_map = _get_integer_type_body_map()
    create_cast_functions(INTEGER, type_body_map, engine)


def create_interval_casts(engine):
    type_body_map = _get_interval_type_body_map()
    create_cast_functions(INTERVAL, type_body_map, engine)


def create_decimal_numeric_casts(engine):
    decimal_types = [DECIMAL, NUMERIC]
    for type_str in decimal_types:
        type_body_map = _get_numeric_type_body_map(target_type_str=type_str)
        create_cast_functions(type_str, type_body_map, engine)


def create_varchar_casts(engine):
    type_body_map = _get_varchar_type_body_map(engine)
    create_cast_functions(VARCHAR, type_body_map, engine)


def get_full_cast_map(engine):
    full_cast_map = {}
    supported_types = get_robust_supported_alter_column_type_map(engine)
    for source, target in get_defined_source_target_cast_tuples(engine):
        source_python_type = supported_types.get(source)
        target_python_type = supported_types.get(target)
        if source_python_type is not None and target_python_type is not None:
            source_db_type = source_python_type().compile(dialect=engine.dialect)
            target_db_type = target_python_type().compile(dialect=engine.dialect)
            full_cast_map.setdefault(source_db_type, []).append(target_db_type)

    return {
        key: list(set(val)) for key, val in full_cast_map.items()
    }


def get_defined_source_target_cast_tuples(engine):
    type_body_map_map = {
        BOOLEAN: _get_boolean_type_body_map(),
        EMAIL: _get_email_type_body_map(),
        DECIMAL: _get_numeric_type_body_map(target_type_str=DECIMAL),
        DOUBLE_PRECISION: _get_float_type_body_map(target_type_str=DOUBLE_PRECISION),
        FLOAT: _get_float_type_body_map(target_type_str=FLOAT),
        INTEGER: _get_integer_type_body_map(target_type_str=INTEGER),
        INTERVAL: _get_interval_type_body_map(),
        NUMERIC: _get_numeric_type_body_map(target_type_str=NUMERIC),
        REAL: _get_float_type_body_map(target_type_str=REAL),
        VARCHAR: _get_varchar_type_body_map(engine),
    }
    return {
        (source_type, target_type)
        for target_type in type_body_map_map
        for source_type in type_body_map_map[target_type]
    }


def create_cast_functions(target_type, type_body_map, engine):
    """
    This python function writes a number of PL/pgSQL functions that cast
    between types supported by Mathesar, and installs them on the DB
    using the given engine.  Each generated PL/pgSQL function has the
    name `cast_to_<target_type>`.  We utilize the function overloading of
    PL/pgSQL to use the correct function body corresponding to a given
    input (source) type.

    Args:
        target_type:   string corresponding to the target type of the
                       cast function.
        type_body_map: dictionary that gives a map between source types
                       and the body of a PL/pgSQL function to cast a
                       given source type to the target type.
        engine:        an SQLAlchemy engine.
    """
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
    bare_type_name = unqualified_type_name.split('(')[0]
    function_type_name = '_'.join(bare_type_name.split())
    bare_function_name = f"cast_to_{function_type_name}"
    return f"{base.get_qualified_name(bare_function_name)}"


def _get_boolean_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to booleans.

    boolean -> boolean:      Identity. No remarks
    varchar -> boolean:      We only cast 't', 'f', 'true', or 'false'
                             all others raise a custom exception.
    number type -> boolean:  We only cast numbers 1 -> true, 0 -> false
                             (this is not default behavior for
                             PostgreSQL).  Others raise a custom
                             exception.
    """
    source_number_types = [
        DECIMAL, DOUBLE_PRECISION, FLOAT, INTEGER, NUMERIC, REAL,
    ]
    default_behavior_source_types = [BOOLEAN]

    not_bool_exception_str = f"RAISE EXCEPTION '% is not a {BOOLEAN}', $1;"

    def _get_number_to_boolean_cast_str():
        return f"""
        BEGIN
          IF $1<>0 AND $1<>1 THEN
            {not_bool_exception_str} END IF;
          RETURN $1<>0;
        END;
        """

    type_body_map = {
        type_name: _get_default_behavior_cast_str(BOOLEAN)
        for type_name in default_behavior_source_types
    }

    type_body_map.update(
        {
            number_type: _get_number_to_boolean_cast_str()
            for number_type in source_number_types
        }
    )
    type_body_map.update(
        {
            VARCHAR: f"""
            DECLARE
            istrue {BOOLEAN};
            BEGIN
              SELECT lower($1)='t' OR lower($1)='true' OR $1='1' INTO istrue;
              IF istrue OR lower($1)='f' OR lower($1)='false' OR $1='0' THEN
                RETURN istrue;
              END IF;
              {not_bool_exception_str}
            END;
            """,
        }

    )
    return type_body_map


def _get_email_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to email.

    email -> email:  Identity. No remarks
    varchar -> email:   We use the default PostgreSQL behavior (this will
                     just check that the VARCHAR object satisfies the email
                     DOMAIN).
    """
    return {
        email.QUALIFIED_EMAIL: """
        BEGIN
          RETURN $1;
        END;
        """,
        VARCHAR: f"""
        BEGIN
          RETURN $1::{email.QUALIFIED_EMAIL};
        END;
        """,
    }


def _get_interval_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to interval.

    interval -> interval:  Identity. No remarks
    varchar -> interval:   We first check that the varchar *cannot* be cast
                           to a numeric, and then try to cast the varchar
                           to an interval.
    """
    return {
        INTERVAL: """
        BEGIN
          RETURN $1;
        END;
        """,
        # We need to check that a string isn't a valid number before
        # casting to intervals (since a number is more likely)
        VARCHAR: f"""
        BEGIN
          PERFORM $1::{NUMERIC};
          RAISE EXCEPTION '% is a {NUMERIC}', $1;
          EXCEPTION
            WHEN sqlstate '22P02' THEN
              RETURN $1::{INTERVAL};
        END;
        """,
    }


def _get_integer_type_body_map(target_type_str=INTEGER):
    default_behavior_source_types = [INTEGER, VARCHAR]
    no_rounding_source_types = [DECIMAL, DOUBLE_PRECISION, FLOAT, NUMERIC, REAL]
    cast_loss_exception_str = (
        f"RAISE EXCEPTION '% cannot be cast to {target_type_str} without loss', $1;"
    )

    def _get_no_rounding_cast_to_integer():
        return f"""
        DECLARE integer_res {target_type_str};
        BEGIN
          SELECT $1::{target_type_str} INTO integer_res;
          IF integer_res = $1 THEN
            RETURN integer_res;
          END IF;
          {cast_loss_exception_str}
        END;
        """

    type_body_map = {
        type_name: _get_default_behavior_cast_str(target_type_str)
        for type_name in default_behavior_source_types
    }
    type_body_map.update(
        {
            type_name: _get_no_rounding_cast_to_integer()
            for type_name in no_rounding_source_types
        }
    )
    type_body_map.update({BOOLEAN: _get_boolean_to_number_cast(target_type_str)})
    return type_body_map


def _get_numeric_type_body_map(target_type_str=NUMERIC):
    """
    Get SQL strings that create various functions for casting different
    types to numerics.

    numeric -> numeric:  Identity. No remarks
    boolean -> numeric:  We cast TRUE -> 1, FALSE -> 0
    varchar -> numeric:  We use the default PostgreSQL behavior.
    """

    default_behavior_source_types = [
        DECIMAL, DOUBLE_PRECISION, FLOAT, INTEGER, NUMERIC, REAL, VARCHAR
    ]
    type_body_map = {
        type_name: _get_default_behavior_cast_str(target_type_str)
        for type_name in default_behavior_source_types
    }
    type_body_map.update({BOOLEAN: _get_boolean_to_number_cast(target_type_str)})
    return type_body_map


def _get_float_type_body_map(target_type_str=FLOAT):
    """
    Get SQL strings that create various functions for casting different
    types to floats.

    float -> float:    Identity. No remarks
    boolean -> float:  We cast TRUE -> 1, FALSE -> 0
    varchar -> float:  We use the default PostgreSQL behavior.
    """
    default_behavior_source_types = [
        DECIMAL, DOUBLE_PRECISION, FLOAT, INTEGER, NUMERIC, REAL, VARCHAR,
    ]
    type_body_map = {
        type_name: _get_default_behavior_cast_str(target_type_str)
        for type_name in default_behavior_source_types
    }
    type_body_map.update({BOOLEAN: _get_boolean_to_number_cast(target_type_str)})
    return type_body_map


def _get_boolean_to_number_cast(target_type):
    return f"""
    BEGIN
      IF $1 THEN
        RETURN 1::{target_type};
      END IF;
      RETURN 0::{target_type};
    END;
    """


def _get_varchar_type_body_map(engine):
    """
    Get SQL strings that create various functions for casting different
    types to varchar.

    All casts to varchar use default PostgreSQL behavior.
    All types in get_supported_alter_column_types are supported.
    """
    supported_types = get_supported_alter_column_db_types(engine)
    type_body_map = {
        type_name: _get_default_behavior_cast_str(VARCHAR)
        for type_name in supported_types
    }
    return type_body_map


def _get_default_behavior_cast_str(target_type_str):
    return f"""
        BEGIN
          RETURN $1::{target_type_str};
        END;
    """
