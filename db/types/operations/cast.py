from sqlalchemy import text
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import Function

from db.types import base, email, money, multicurrency, uri
from db.types.exceptions import UnsupportedTypeException

# DB type name strings
BIGINT = base.PostgresType.BIGINT.value
BOOLEAN = base.PostgresType.BOOLEAN.value
DATE = base.PostgresType.DATE.value
DECIMAL = base.PostgresType.DECIMAL.value
DOUBLE_PRECISION = base.PostgresType.DOUBLE_PRECISION.value
FLOAT = base.PostgresType.FLOAT.value
INTEGER = base.PostgresType.INTEGER.value
INTERVAL = base.PostgresType.INTERVAL.value
MONEY = base.PostgresType.MONEY.value
NUMERIC = base.PostgresType.NUMERIC.value
REAL = base.PostgresType.REAL.value
SMALLINT = base.PostgresType.SMALLINT.value
TEXT = base.PostgresType.TEXT.value

# one-off strings representing keys in ischema_names
CHAR = base.CHAR
STRING = base.STRING
VARCHAR = base.VARCHAR

# custom types
EMAIL = base.MathesarCustomType.EMAIL.value
MATHESAR_MONEY = base.MathesarCustomType.MATHESAR_MONEY.value
MULTICURRENCY_MONEY = base.MathesarCustomType.MULTICURRENCY_MONEY.value
TIME_WITHOUT_TIME_ZONE = base.PostgresType.TIME_WITHOUT_TIME_ZONE.value
TIME_WITH_TIME_ZONE = base.PostgresType.TIME_WITH_TIME_ZONE.value
TIMESTAMP_WITH_TIME_ZONE = base.PostgresType.TIMESTAMP_WITH_TIME_ZONE.value
TIMESTAMP_WITHOUT_TIME_ZONE = base.PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE.value
URI = base.MathesarCustomType.URI.value

# only needed for ischema lookup
FULL_VARCHAR = base.PostgresType.CHARACTER_VARYING.value
FULL_CHAR = base.PostgresType.CHARACTER.value
NAME = base.PostgresType.NAME.value
MATHESAR_CHAR = base.PostgresType.MATHESAR_CHAR.value

DECIMAL_TYPES = frozenset([DECIMAL, DOUBLE_PRECISION, FLOAT, REAL])
INTEGER_TYPES = frozenset([BIGINT, INTEGER, SMALLINT])
NUMBER_TYPES = DECIMAL_TYPES | INTEGER_TYPES | frozenset([NUMERIC])
TEXT_TYPES = frozenset([CHAR, TEXT, VARCHAR])

MONEY_ARR_FUNC_NAME = "get_mathesar_money_array"
NUMERIC_ARR_FUNC_NAME = "get_numeric_array"


def get_supported_alter_column_types(engine, friendly_names=True):
    """
    Returns a list of valid types supported by mathesar for the given engine.

    engine:  This should be an engine connecting to the DB where we want
    to inspect the installed types.
    friendly_names: sets whether to use "friendly" service-layer or the
    actual DB-layer names.
    """
    dialect_types = base.get_available_types(engine)
    friendly_type_map = {
        # Default Postgres types
        BIGINT: dialect_types.get(BIGINT),
        BOOLEAN: dialect_types.get(BOOLEAN),
        CHAR: dialect_types.get(FULL_CHAR),
        DATE: dialect_types.get(DATE),
        DECIMAL: dialect_types.get(DECIMAL),
        DOUBLE_PRECISION: dialect_types.get(DOUBLE_PRECISION),
        FLOAT: dialect_types.get(FLOAT),
        INTEGER: dialect_types.get(INTEGER),
        INTERVAL: dialect_types.get(INTERVAL),
        MONEY: dialect_types.get(MONEY),
        NUMERIC: dialect_types.get(NUMERIC),
        REAL: dialect_types.get(REAL),
        SMALLINT: dialect_types.get(SMALLINT),
        STRING: dialect_types.get(NAME),
        TEXT: dialect_types.get(TEXT),
        TIME_WITHOUT_TIME_ZONE: dialect_types.get(TIME_WITHOUT_TIME_ZONE),
        TIME_WITH_TIME_ZONE: dialect_types.get(TIME_WITH_TIME_ZONE),
        TIMESTAMP_WITH_TIME_ZONE: dialect_types.get(TIMESTAMP_WITH_TIME_ZONE),
        TIMESTAMP_WITHOUT_TIME_ZONE: dialect_types.get(TIMESTAMP_WITHOUT_TIME_ZONE),
        VARCHAR: dialect_types.get(FULL_VARCHAR),
        MATHESAR_CHAR: dialect_types.get(MATHESAR_CHAR),
        # Custom Mathesar types
        EMAIL: dialect_types.get(email.DB_TYPE),
        MATHESAR_MONEY: dialect_types.get(money.DB_TYPE),
        MULTICURRENCY_MONEY: dialect_types.get(multicurrency.DB_TYPE),
        URI: dialect_types.get(uri.DB_TYPE),
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
        type_with_options = target_type(**type_options)
        cast_expr = cast_expr.cast(type_with_options)
    return cast_expr


def install_all_casts(engine):
    create_boolean_casts(engine)
    create_date_casts(engine)
    create_decimal_number_casts(engine)
    create_email_casts(engine)
    create_integer_casts(engine)
    create_interval_casts(engine)
    create_datetime_casts(engine)
    create_mathesar_money_casts(engine)
    create_money_casts(engine)
    create_multicurrency_money_casts(engine)
    create_textual_casts(engine)
    create_uri_casts(engine)
    create_numeric_casts(engine)


def create_boolean_casts(engine):
    type_body_map = _get_boolean_type_body_map()
    create_cast_functions(BOOLEAN, type_body_map, engine)


def create_date_casts(engine):
    type_body_map = _get_date_type_body_map()
    create_cast_functions(DATE, type_body_map, engine)


def create_decimal_number_casts(engine):
    decimal_number_types = DECIMAL_TYPES
    for type_str in decimal_number_types:
        type_body_map = _get_decimal_number_type_body_map(target_type_str=type_str)
        create_cast_functions(type_str, type_body_map, engine)


def create_email_casts(engine):
    type_body_map = _get_email_type_body_map()
    create_cast_functions(email.DB_TYPE, type_body_map, engine)


def create_integer_casts(engine):
    integer_types = [BIGINT, INTEGER, SMALLINT]
    for type_str in integer_types:
        type_body_map = _get_integer_type_body_map(target_type_str=type_str)
        create_cast_functions(type_str, type_body_map, engine)


def create_interval_casts(engine):
    type_body_map = _get_interval_type_body_map()
    create_cast_functions(INTERVAL, type_body_map, engine)


def create_datetime_casts(engine):
    time_types = [TIME_WITHOUT_TIME_ZONE, TIME_WITH_TIME_ZONE]
    for time_type in time_types:
        type_body_map = _get_time_type_body_map(time_type)
        create_cast_functions(time_type, type_body_map, engine)

    type_body_map = _get_timestamp_with_timezone_type_body_map(TIMESTAMP_WITH_TIME_ZONE)
    create_cast_functions(TIMESTAMP_WITH_TIME_ZONE, type_body_map, engine)

    type_body_map = _get_timestamp_without_timezone_type_body_map()
    create_cast_functions(TIMESTAMP_WITHOUT_TIME_ZONE, type_body_map, engine)

    type_body_map = _get_date_type_body_map()
    create_cast_functions(DATE, type_body_map, engine)


def create_mathesar_money_casts(engine):
    mathesar_money_array_create = _build_mathesar_money_array_function()
    with engine.begin() as conn:
        conn.execute(text(mathesar_money_array_create))
    type_body_map = _get_mathesar_money_type_body_map()
    create_cast_functions(money.DB_TYPE, type_body_map, engine)


def create_money_casts(engine):
    type_body_map = _get_money_type_body_map()
    create_cast_functions(MONEY, type_body_map, engine)


def create_multicurrency_money_casts(engine):
    type_body_map = _get_multicurrency_money_type_body_map()
    create_cast_functions(multicurrency.DB_TYPE, type_body_map, engine)


def create_textual_casts(engine):
    textual_types = TEXT_TYPES
    for type_str in textual_types:
        type_body_map = _get_textual_type_body_map(engine, target_type_str=type_str)
        create_cast_functions(type_str, type_body_map, engine)


def create_uri_casts(engine):
    type_body_map = _get_uri_type_body_map()
    create_cast_functions(uri.DB_TYPE, type_body_map, engine)


def create_numeric_casts(engine):
    numeric_array_create = _build_numeric_array_function()
    with engine.begin() as conn:
        conn.execute(text(numeric_array_create))
    type_body_map = _get_numeric_type_body_map()
    create_cast_functions(NUMERIC, type_body_map, engine)


def get_full_cast_map(engine):
    full_cast_map = {}
    supported_types = get_robust_supported_alter_column_type_map(engine)
    for source, target in get_defined_source_target_cast_tuples(engine):
        source_python_type = supported_types.get(source)
        print(source)
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
        BIGINT: _get_integer_type_body_map(target_type_str=BIGINT),
        BOOLEAN: _get_boolean_type_body_map(),
        CHAR: _get_textual_type_body_map(engine, target_type_str=CHAR),
        DATE: _get_date_type_body_map(),
        DECIMAL: _get_decimal_number_type_body_map(target_type_str=DECIMAL),
        DOUBLE_PRECISION: _get_decimal_number_type_body_map(target_type_str=DOUBLE_PRECISION),
        EMAIL: _get_email_type_body_map(),
        FLOAT: _get_decimal_number_type_body_map(target_type_str=FLOAT),
        INTEGER: _get_integer_type_body_map(target_type_str=INTEGER),
        MATHESAR_MONEY: _get_mathesar_money_type_body_map(),
        MONEY: _get_money_type_body_map(),
        MULTICURRENCY_MONEY: _get_multicurrency_money_type_body_map(),
        INTERVAL: _get_interval_type_body_map(),
        NUMERIC: _get_numeric_type_body_map(),
        REAL: _get_decimal_number_type_body_map(target_type_str=REAL),
        SMALLINT: _get_integer_type_body_map(target_type_str=SMALLINT),
        TIME_WITHOUT_TIME_ZONE: _get_time_type_body_map(TIME_WITHOUT_TIME_ZONE),
        TIME_WITH_TIME_ZONE: _get_time_type_body_map(TIME_WITH_TIME_ZONE),
        TIMESTAMP_WITH_TIME_ZONE: _get_timestamp_with_timezone_type_body_map(TIMESTAMP_WITH_TIME_ZONE),
        TIMESTAMP_WITHOUT_TIME_ZONE: _get_timestamp_without_timezone_type_body_map(),
        TEXT: _get_textual_type_body_map(engine, target_type_str=TEXT),
        URI: _get_uri_type_body_map(),
        VARCHAR: _get_textual_type_body_map(engine, target_type_str=VARCHAR),
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
    $$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;
    """


def get_cast_function_name(target_type):
    """
    Some casting functions change postgres config parameters  for the
    transaction they are run on like cast function for casting different
    data type to timestamp with timezone, So they used be in an isolated
    transaction
    """
    unqualified_type_name = target_type.split('.')[-1].lower()
    if '(' in unqualified_type_name:
        bare_type_name = unqualified_type_name[:unqualified_type_name.find('(')]
        if unqualified_type_name[-1] != ')':
            bare_type_name += unqualified_type_name[unqualified_type_name.find(')') + 1:]
    else:
        bare_type_name = unqualified_type_name
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
    source_number_types = NUMBER_TYPES
    source_text_types = TEXT_TYPES
    default_behavior_source_types = frozenset([BOOLEAN])

    not_bool_exception_str = f"RAISE EXCEPTION '% is not a {BOOLEAN}', $1;"

    def _get_number_to_boolean_cast_str():
        return f"""
        BEGIN
          IF $1<>0 AND $1<>1 THEN
            {not_bool_exception_str} END IF;
          RETURN $1<>0;
        END;
        """

    def _get_text_to_boolean_cast_str():
        return f"""
        DECLARE
        istrue {BOOLEAN};
        BEGIN
          SELECT
            $1='1' OR lower($1) = 'on'
            OR lower($1)='t' OR lower($1)='true'
            OR lower($1)='y' OR lower($1)='yes'
          INTO istrue;
          IF istrue
            OR $1='0' OR lower($1) = 'off'
            OR lower($1)='f' OR lower($1)='false'
            OR lower($1)='n' OR lower($1)='no'
          THEN
            RETURN istrue;
          END IF;
          {not_bool_exception_str}
        END;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, BOOLEAN,
    )
    type_body_map.update(
        {
            number_type: _get_number_to_boolean_cast_str()
            for number_type in source_number_types
        }
    )
    type_body_map.update(
        {
            text_type: _get_text_to_boolean_cast_str()
            for text_type in source_text_types
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
    default_behavior_source_types = frozenset([email.DB_TYPE]) | TEXT_TYPES
    return _get_default_type_body_map(
        default_behavior_source_types, email.DB_TYPE,
    )


def _get_interval_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to interval.

    interval -> interval:  Identity. No remarks
    text_type -> interval: We first check that the varchar *cannot* be cast
                           to a numeric, and then try to cast the varchar
                           to an interval.
    """
    source_text_types = TEXT_TYPES

    def _get_text_interval_type_body_map():
        # We need to check that a string isn't a valid number before
        # casting to intervals (since a number is more likely)
        return f""" BEGIN
          PERFORM $1::{NUMERIC};
          RAISE EXCEPTION '% is a {NUMERIC}', $1;
          EXCEPTION
            WHEN sqlstate '22P02' THEN
              RETURN $1::{INTERVAL};
        END;
        """

    type_body_map = {
        INTERVAL: """
        BEGIN
          RETURN $1;
        END;
        """
    }
    type_body_map.update(
        {
            text_type: _get_text_interval_type_body_map()
            for text_type in source_text_types
        }
    )
    return type_body_map


def _get_integer_type_body_map(target_type_str=INTEGER):
    """
    We use default behavior for identity and casts from TEXT types.
    We specifically disallow rounding or truncating when casting from numerics,
    etc.
    """
    default_behavior_source_types = INTEGER_TYPES | TEXT_TYPES
    no_rounding_source_types = DECIMAL_TYPES | frozenset([money.DB_TYPE, NUMERIC])
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

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, target_type_str,
    )
    type_body_map.update(
        {
            type_name: _get_no_rounding_cast_to_integer()
            for type_name in no_rounding_source_types
        }
    )
    type_body_map.update({BOOLEAN: _get_boolean_to_number_cast(target_type_str)})
    return type_body_map


def _get_decimal_number_type_body_map(target_type_str=NUMERIC):
    """
    Get SQL strings that create various functions for casting different
    types to number types including DECIMAL, DOUBLE PRECISION, FLOAT,
    NUMERIC, and REAL.

    The only notable non-default cast is from boolean:
        boolean -> number:  We cast TRUE -> 1, FALSE -> 0
    """

    default_behavior_source_types = NUMBER_TYPES | TEXT_TYPES | frozenset([money.DB_TYPE])
    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, target_type_str,
    )
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


def _get_time_type_body_map(target_type):
    default_behavior_source_types = [
        TEXT, VARCHAR, TIME_WITHOUT_TIME_ZONE, TIME_WITH_TIME_ZONE
    ]
    return _get_default_type_body_map(
        default_behavior_source_types, target_type,
    )


def get_text_and_datetime_to_datetime_cast_str(type_condition, exception_string):
    return f"""
    DECLARE
    timestamp_value_with_tz NUMERIC;
    timestamp_value NUMERIC;
    date_value NUMERIC;
    BEGIN
        SET LOCAL TIME ZONE 'UTC';
        SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
        SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
        SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
        {type_condition}

      {exception_string}
    END;
    """


def _get_timestamp_with_timezone_type_body_map(target_type):
    datetime_source_types = frozenset(
        [TIMESTAMP_WITH_TIME_ZONE, TIMESTAMP_WITHOUT_TIME_ZONE, DATE]
    )
    default_behavior_source_types = datetime_source_types | TEXT_TYPES
    return _get_default_type_body_map(default_behavior_source_types, target_type)


def _get_timestamp_without_timezone_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to timestamp without timezone.
    We allow casting any text, timezone and date type to be cast into a
    timestamp without timezone, provided it does not any timezone
    information as this could lead to a information loss

    The cast function changes the timezone to `utc` for the transaction
    is called on.  So this function call should be used in a isolated
    transaction to avoid timezone change causing unintended side effect
    """
    source_text_types = TEXT_TYPES
    source_datetime_types = frozenset([TIMESTAMP_WITH_TIME_ZONE, DATE])
    default_behavior_source_types = frozenset([TIMESTAMP_WITHOUT_TIME_ZONE])

    not_timestamp_without_tz_exception_str = (
        f"RAISE EXCEPTION '% is not a {TIMESTAMP_WITHOUT_TIME_ZONE}', $1;"
    )
    # Check if the value is missing timezone by casting it to a timestamp
    # with timezone and comparing if the value is equal to a timestamp
    # without timezone.
    timestamp_without_tz_condition_str = f"""
            IF (timestamp_value_with_tz = timestamp_value) THEN
            RETURN $1::{TIMESTAMP_WITHOUT_TIME_ZONE};
            END IF;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, TIMESTAMP_WITHOUT_TIME_ZONE,
    )
    type_body_map.update(
        {
            text_type: get_text_and_datetime_to_datetime_cast_str(
                timestamp_without_tz_condition_str,
                not_timestamp_without_tz_exception_str
            )
            for text_type in source_text_types
        }
    )
    type_body_map.update(
        {
            datetime_type: get_text_and_datetime_to_datetime_cast_str(
                timestamp_without_tz_condition_str,
                not_timestamp_without_tz_exception_str
            )
            for datetime_type in source_datetime_types
        }
    )
    return type_body_map


def _get_mathesar_money_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to money.
    We allow casting any number type to our custom money.
    We allow casting the default money type to our custom money.
    We allow casting any textual type to money with the text prefixed or
    suffixed with a currency.
    """
    money_array_function = base.get_qualified_name(MONEY_ARR_FUNC_NAME)
    default_behavior_source_types = frozenset([money.DB_TYPE])
    number_types = NUMBER_TYPES
    textual_types = TEXT_TYPES | frozenset([MONEY])
    cast_exception_str = (
        f"RAISE EXCEPTION '% cannot be cast to {money.DB_TYPE}', $1;"
    )

    def _get_number_cast_to_money():
        return f"""
        BEGIN
          RETURN $1::numeric::{money.DB_TYPE};
        END;
        """

    def _get_base_textual_cast_to_money():
        return rf"""
        DECLARE decimal_point {TEXT};
        DECLARE is_negative {BOOLEAN};
        DECLARE money_arr {TEXT}[];
        DECLARE money_num {TEXT};
        BEGIN
          SELECT {money_array_function}($1::{TEXT}) INTO money_arr;
          IF money_arr IS NULL THEN
            {cast_exception_str}
          END IF;

          SELECT money_arr[1] INTO money_num;
          SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
          SELECT $1::text ~ '^.*(-|\(.+\)).*$' INTO is_negative;

          IF money_arr[2] IS NOT NULL THEN
            SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
          END IF;
          IF money_arr[3] IS NOT NULL THEN
            SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
          END IF;
          IF is_negative THEN
            RETURN ('-' || money_num)::{money.DB_TYPE};
          END IF;
          RETURN money_num::{money.DB_TYPE};
        END;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, money.DB_TYPE,
    )
    type_body_map.update(
        {
            type_name: _get_number_cast_to_money()
            for type_name in number_types
        }
    )
    type_body_map.update(
        {
            type_name: _get_base_textual_cast_to_money()
            for type_name in textual_types
        }
    )
    return type_body_map


def _build_mathesar_money_array_function():
    """
    The main reason for this function to be separate is for testing. This
    does have some performance impact; we should consider inlining later.
    """
    qualified_function_name = base.get_qualified_name(MONEY_ARR_FUNC_NAME)

    # An attempt to separate pieces into logical bits for easier
    # understanding and modification
    non_numeric = r"(?:[^.,0-9]+)"
    no_separator_big = r"[0-9]{4,}(?:([,.])[0-9]+)?"
    no_separator_small = r"[0-9]{1,3}(?:([,.])[0-9]{1,2}|[0-9]{4,})?"
    comma_separator_req_decimal = r"[0-9]{1,3}(,)[0-9]{3}(\.)[0-9]+"
    period_separator_req_decimal = r"[0-9]{1,3}(\.)[0-9]{3}(,)[0-9]+"
    comma_separator_opt_decimal = r"[0-9]{1,3}(?:(,)[0-9]{3}){2,}(?:(\.)[0-9]+)?"
    period_separator_opt_decimal = r"[0-9]{1,3}(?:(\.)[0-9]{3}){2,}(?:(,)[0-9]+)?"
    space_separator_opt_decimal = r"[0-9]{1,3}(?:( )[0-9]{3})+(?:([,.])[0-9]+)?"
    comma_separator_lakh_system = r"[0-9]{1,2}(?:(,)[0-9]{2})+,[0-9]{3}(?:(\.)[0-9]+)?"

    inner_number_tree = "|".join(
        [
            no_separator_big,
            no_separator_small,
            comma_separator_req_decimal,
            period_separator_req_decimal,
            comma_separator_opt_decimal,
            period_separator_opt_decimal,
            space_separator_opt_decimal,
            comma_separator_lakh_system,
        ]
    )
    inner_number_group = f"({inner_number_tree})"
    required_currency_beginning = f"{non_numeric}{inner_number_group}{non_numeric}?"
    required_currency_ending = f"{non_numeric}?{inner_number_group}{non_numeric}"
    money_finding_regex = f"^(?:{required_currency_beginning}|{required_currency_ending})$"

    actual_number_indices = [1, 16]
    group_divider_indices = [4, 6, 8, 10, 12, 14, 19, 21, 23, 25, 27, 29]
    decimal_point_indices = [2, 3, 5, 7, 9, 11, 13, 15, 17, 18, 20, 22, 24, 26, 28, 30]
    actual_numbers_str = ','.join([f'raw_arr[{idx}]' for idx in actual_number_indices])
    group_dividers_str = ','.join([f'raw_arr[{idx}]' for idx in group_divider_indices])
    decimal_points_str = ','.join([f'raw_arr[{idx}]' for idx in decimal_point_indices])

    return rf"""
    CREATE OR REPLACE FUNCTION {qualified_function_name}({TEXT}) RETURNS {TEXT}[]
    AS $$
      DECLARE
        raw_arr {TEXT}[];
        actual_number_arr {TEXT}[];
        group_divider_arr {TEXT}[];
        decimal_point_arr {TEXT}[];
        actual_number {TEXT};
        group_divider {TEXT};
        decimal_point {TEXT};
      BEGIN
        SELECT regexp_matches($1, '{money_finding_regex}') INTO raw_arr;
        IF raw_arr IS NULL THEN
          RETURN NULL;
        END IF;
        SELECT array_remove(ARRAY[{actual_numbers_str}], null) INTO actual_number_arr;
        SELECT array_remove(ARRAY[{group_dividers_str}], null) INTO group_divider_arr;
        SELECT array_remove(ARRAY[{decimal_points_str}], null) INTO decimal_point_arr;
        SELECT actual_number_arr[1] INTO actual_number;
        SELECT group_divider_arr[1] INTO group_divider;
        SELECT decimal_point_arr[1] INTO decimal_point;
        RETURN ARRAY[actual_number, group_divider, decimal_point, replace($1, actual_number, '')];
      END;
    $$ LANGUAGE plpgsql;
    """


def _get_money_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to money.
    We allow casting any number type to money, assuming currency is the
    locale currency.
    We allow casting our custom money type to money assuming currency is the
    locale currency.
    We allow casting any textual type to money with the text prefixed or
    suffixed with the locale currency.
    """
    default_behavior_source_types = frozenset([MONEY, money.DB_TYPE])
    number_types = NUMBER_TYPES
    textual_types = TEXT_TYPES
    cast_loss_exception_str = (
        f"RAISE EXCEPTION '% cannot be cast to {MONEY} as currency symbol is missing', $1;"
    )

    def _get_number_cast_to_money():
        return f"""
        BEGIN
          RETURN $1::numeric::{MONEY};
        END;
        """

    def _get_base_textual_cast_to_money():
        return f"""
        DECLARE currency {TEXT};
        BEGIN
          SELECT to_char(1, 'L') INTO currency;
          IF ($1 LIKE '%' || currency) OR ($1 LIKE currency || '%') THEN
            RETURN $1::{MONEY};
          END IF;
          {cast_loss_exception_str}
        END;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, MONEY,
    )
    type_body_map.update(
        {
            type_name: _get_number_cast_to_money()
            for type_name in number_types
        }
    )
    type_body_map.update(
        {
            type_name: _get_base_textual_cast_to_money()
            for type_name in textual_types
        }
    )
    return type_body_map


def _get_multicurrency_money_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to money.
    We allow casting any number type to money, assuming currency is USD.
    We allow casting any textual type to money, assuming currency is USD
    and that the type can be cast through a numeric.
    """
    default_behavior_source_types = [multicurrency.DB_TYPE]
    number_types = NUMBER_TYPES | frozenset([money.DB_TYPE])
    textual_types = TEXT_TYPES | frozenset([MONEY])

    def _get_number_cast_to_money():
        return f"""
        BEGIN
          RETURN ROW($1, 'USD')::{multicurrency.DB_TYPE};
        END;
        """

    def _get_base_textual_cast_to_money():
        return f"""
        BEGIN
          RETURN ROW($1::numeric, 'USD')::{multicurrency.DB_TYPE};
        END;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, multicurrency.DB_TYPE,
    )
    type_body_map.update(
        {
            type_name: _get_number_cast_to_money()
            for type_name in number_types
        }
    )
    type_body_map.update(
        {
            type_name: _get_base_textual_cast_to_money()
            for type_name in textual_types
        }
    )
    return type_body_map


def _get_textual_type_body_map(engine, target_type_str=VARCHAR):
    """
    Get SQL strings that create various functions for casting different
    types to text types through the TEXT type.

    All casts to varchar use default PostgreSQL behavior.
    All types in get_supported_alter_column_types are supported.
    """
    supported_types = get_supported_alter_column_db_types(engine)

    # We cast everything through TEXT so that formatting is done correctly
    # for CHAR.
    text_cast_str = f"""
        BEGIN
          RETURN $1::{TEXT};
        END;
    """

    return {type_: text_cast_str for type_ in supported_types}


def _get_date_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to date.

    We allow casting any text, timezone and date type to be cast into a
    timestamp without timezone, provided it does not any timezone
    information as this could lead to a information loss.

    The cast function changes the timezone to `utc` for the transaction
    is called on.  So this function call should be used in a isolated
    transaction to avoid timezone change causing unintended side effect.
    """
    # Note that default postgres conversion for dates depends on the
    # `DateStyle` option set on the server, which can be one of DMY, MDY,
    # or YMD. Defaults to MDY.
    source_text_types = TEXT_TYPES
    source_datetime_types = frozenset([TIMESTAMP_WITH_TIME_ZONE, TIMESTAMP_WITHOUT_TIME_ZONE])
    default_behavior_source_types = frozenset([DATE])

    not_date_exception_str = f"RAISE EXCEPTION '% is not a {DATE}', $1;"
    date_condition_str = f"""
            IF (timestamp_value_with_tz = date_value) THEN
            RETURN $1::{DATE};
            END IF;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, TIMESTAMP_WITH_TIME_ZONE
    )
    type_body_map.update(
        {
            text_type: get_text_and_datetime_to_datetime_cast_str(date_condition_str, not_date_exception_str)
            for text_type in source_text_types
        }
    )
    type_body_map.update(
        {
            datetime_type: get_text_and_datetime_to_datetime_cast_str(date_condition_str, not_date_exception_str)
            for datetime_type in source_datetime_types
        }
    )
    return type_body_map


def _get_uri_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to URIs.
    """

    def _get_text_uri_type_body_map():
        # We need to check that a string isn't a valid number before
        # casting to intervals (since a number is more likely)
        auth_func = uri.QualifiedURIFunction.AUTHORITY.value
        tld_regex = r"'(?<=\.)(?:.(?!\.))+$'"
        not_uri_exception_str = f"RAISE EXCEPTION '% is not a {URI}', $1;"
        return f"""
        DECLARE uri_res {uri.DB_TYPE} := 'https://centerofci.org';
        DECLARE uri_tld {TEXT};
        BEGIN
          RETURN $1::{uri.DB_TYPE};
          EXCEPTION WHEN SQLSTATE '23514' THEN
              SELECT lower(('http://' || $1)::{uri.DB_TYPE}) INTO uri_res;
              SELECT (regexp_match({auth_func}(uri_res), {tld_regex}))[1]
                INTO uri_tld;
              IF EXISTS(SELECT 1 FROM {uri.QUALIFIED_TLDS} WHERE tld = uri_tld) THEN
                RETURN uri_res;
              END IF;
          {not_uri_exception_str}
        END;
        """

    source_types = frozenset([uri.DB_TYPE]) | TEXT_TYPES
    return {type_: _get_text_uri_type_body_map() for type_ in source_types}


def _get_numeric_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to numeric.
    We allow casting any textual type to locale-agnostic numeric.
    """
    default_behavior_source_types = NUMBER_TYPES | frozenset([money.DB_TYPE])
    text_source_types = TEXT_TYPES

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, NUMERIC
    )
    type_body_map.update(
        {
            text_type: _get_text_to_numeric_cast()
            for text_type in text_source_types
        }
    )
    type_body_map.update({BOOLEAN: _get_boolean_to_number_cast(NUMERIC)})
    return type_body_map


def _get_text_to_numeric_cast():
    numeric_array_function = base.get_qualified_name(NUMERIC_ARR_FUNC_NAME)
    cast_exception_str = (
        f"RAISE EXCEPTION '% cannot be cast to {NUMERIC}', $1;"
    )
    return rf"""
    DECLARE decimal_point {TEXT};
    DECLARE is_negative {BOOLEAN};
    DECLARE money_arr {TEXT}[];
    DECLARE money_num {TEXT};
    BEGIN
        SELECT {numeric_array_function}($1::{TEXT}) INTO money_arr;
        IF money_arr IS NULL THEN
            {cast_exception_str}
        END IF;

        SELECT money_arr[1] INTO money_num;
        SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
        SELECT $1::text ~ '^-.*$' INTO is_negative;

        IF money_arr[2] IS NOT NULL THEN
            SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
        END IF;
        IF money_arr[3] IS NOT NULL THEN
            SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
        END IF;
        IF is_negative THEN
            RETURN ('-' || money_num)::{NUMERIC};
        END IF;
        RETURN money_num::{NUMERIC};
    END;
    """


def _build_numeric_array_function():
    """
    The main reason for this function to be separate is for testing. This
    does have some performance impact; we should consider inlining later.
    """
    qualified_function_name = base.get_qualified_name(NUMERIC_ARR_FUNC_NAME)

    no_separator = r"[0-9]+(?:([.,])[0-9]+)?"
    period_sep_comma_decimal = r"[0-9]{1,3}(?:(\.)[0-9]{3})+(?:(,)[0-9]+)?"
    comma_sep_period_decimal = r"[0-9]{1,3}(?:(,)[0-9]{3})+(?:(\.)[0-9]+)?"
    space_sep_comma_decimal = r"[0-9]{1,3}(?:( )[0-9]{3})+(?:(,)[0-9]+)?"
    comma_sep_period_decimal_lakh = r"[0-9]{1,3}(?:(,)[0-9]{2})+,[0-9]{3}(?:(\.)[0-9]+)?"
    apostophe_sep_period_decima = r"[0-9]{1,3}(?:(\'')[0-9]{3})+(?:(\.)[0-9]+)?"

    inner_number_tree = "|".join(
        [
            no_separator,
            period_sep_comma_decimal,
            comma_sep_period_decimal,
            space_sep_comma_decimal,
            comma_sep_period_decimal_lakh,
            apostophe_sep_period_decima
        ]
    )
    numeric_finding_regex = f"^[-+]?(?:({inner_number_tree}))$"

    actual_number_indices = [1]
    group_divider_indices = [3, 5, 7, 9, 11]
    decimal_point_indices = [2, 4, 6, 8, 10, 12]
    actual_numbers_str = ','.join([f'raw_arr[{idx}]' for idx in actual_number_indices])
    group_dividers_str = ','.join([f'raw_arr[{idx}]' for idx in group_divider_indices])
    decimal_points_str = ','.join([f'raw_arr[{idx}]' for idx in decimal_point_indices])

    return rf"""
    CREATE OR REPLACE FUNCTION {qualified_function_name}({TEXT}) RETURNS {TEXT}[]
    AS $$
      DECLARE
        raw_arr {TEXT}[];
        actual_number_arr {TEXT}[];
        group_divider_arr {TEXT}[];
        decimal_point_arr {TEXT}[];
        actual_number {TEXT};
        group_divider {TEXT};
        decimal_point {TEXT};
      BEGIN
        SELECT regexp_matches($1, '{numeric_finding_regex}') INTO raw_arr;
        IF raw_arr IS NULL THEN
          RETURN NULL;
        END IF;
        SELECT array_remove(ARRAY[{actual_numbers_str}], null) INTO actual_number_arr;
        SELECT array_remove(ARRAY[{group_dividers_str}], null) INTO group_divider_arr;
        SELECT array_remove(ARRAY[{decimal_points_str}], null) INTO decimal_point_arr;
        SELECT actual_number_arr[1] INTO actual_number;
        SELECT group_divider_arr[1] INTO group_divider;
        SELECT decimal_point_arr[1] INTO decimal_point;
        RETURN ARRAY[actual_number, group_divider, decimal_point];
      END;
    $$ LANGUAGE plpgsql;
    """


def _get_default_type_body_map(source_types, target_type_str):
    default_cast_str = f"""
        BEGIN
          RETURN $1::{target_type_str};
        END;
    """
    return {type_name: default_cast_str for type_name in source_types}
