from frozendict import frozendict

from sqlalchemy import text
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import Function

from db.types.custom import uri
from db.types.exceptions import UnsupportedTypeException
from db.types.base import PostgresType, MathesarCustomType, get_available_known_db_types, get_qualified_name
from db.types.operations.convert import get_db_type_enum_from_class
from db.types import categories
from db.types.custom.money import MONEY_ARR_FUNC_NAME

NUMERIC_ARR_FUNC_NAME = "get_numeric_array"


def get_column_cast_expression(column, target_type, engine, type_options=None):
    """
    Given a Column, we get the correct SQL selectable for selecting the
    results of a Mathesar cast_to_<type> function on that column, where
    <type> is derived from the target_type.
    """
    if type_options is None:
        type_options = {}
    target_type_class = target_type.get_sa_class(engine)
    if target_type_class is None:
        raise UnsupportedTypeException(
            f"Target Type '{target_type.id}' is not supported."
        )
    column_type = get_db_type_enum_from_class(column.type.__class__)
    if target_type == column_type:
        cast_expr = column
    else:
        qualified_function_name = get_cast_function_name(target_type)
        cast_expr = Function(
            quoted_name(qualified_function_name, False),
            column
        )
    if type_options:
        type_with_options = target_type_class(**type_options)
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
    create_json_casts(engine)


def create_boolean_casts(engine):
    type_body_map = _get_boolean_type_body_map()
    create_cast_functions(PostgresType.BOOLEAN, type_body_map, engine)


def create_date_casts(engine):
    type_body_map = _get_date_type_body_map()
    create_cast_functions(PostgresType.DATE, type_body_map, engine)


def create_json_casts(engine):
    json_types = categories.JSON_TYPES
    for db_type in json_types:
        type_body_map = _get_json_type_body_map(db_type)
        create_cast_functions(db_type, type_body_map, engine)


def create_decimal_number_casts(engine):
    decimal_number_types = categories.DECIMAL_TYPES
    for db_type in decimal_number_types:
        type_body_map = _get_decimal_number_type_body_map(target_type=db_type)
        create_cast_functions(db_type, type_body_map, engine)


def create_email_casts(engine):
    type_body_map = _get_email_type_body_map()
    create_cast_functions(MathesarCustomType.EMAIL, type_body_map, engine)


def create_integer_casts(engine):
    integer_types = categories.INTEGER_TYPES
    for db_type in integer_types:
        type_body_map = _get_integer_type_body_map(target_type=db_type)
        create_cast_functions(db_type, type_body_map, engine)


def create_interval_casts(engine):
    type_body_map = _get_interval_type_body_map()
    create_cast_functions(PostgresType.INTERVAL, type_body_map, engine)


def create_datetime_casts(engine):
    time_types = [PostgresType.TIME_WITHOUT_TIME_ZONE, PostgresType.TIME_WITH_TIME_ZONE]
    for time_type in time_types:
        type_body_map = _get_time_type_body_map(time_type)
        create_cast_functions(time_type, type_body_map, engine)

    type_body_map = _get_timestamp_with_timezone_type_body_map(PostgresType.TIMESTAMP_WITH_TIME_ZONE)
    create_cast_functions(PostgresType.TIMESTAMP_WITH_TIME_ZONE, type_body_map, engine)

    type_body_map = _get_timestamp_without_timezone_type_body_map()
    create_cast_functions(PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE, type_body_map, engine)

    type_body_map = _get_date_type_body_map()
    create_cast_functions(PostgresType.DATE, type_body_map, engine)


def create_mathesar_money_casts(engine):
    mathesar_money_array_create = _build_mathesar_money_array_function()
    with engine.begin() as conn:
        conn.execute(text(mathesar_money_array_create))
    type_body_map = _get_mathesar_money_type_body_map()
    create_cast_functions(MathesarCustomType.MATHESAR_MONEY, type_body_map, engine)


def create_money_casts(engine):
    type_body_map = _get_money_type_body_map()
    create_cast_functions(PostgresType.MONEY, type_body_map, engine)


def create_multicurrency_money_casts(engine):
    type_body_map = _get_multicurrency_money_type_body_map()
    create_cast_functions(MathesarCustomType.MULTICURRENCY_MONEY, type_body_map, engine)


def create_textual_casts(engine):
    textual_types = categories.STRING_LIKE_TYPES
    for db_type in textual_types:
        type_body_map = _get_textual_type_body_map(engine)
        create_cast_functions(db_type, type_body_map, engine)


def create_uri_casts(engine):
    type_body_map = _get_uri_type_body_map()
    create_cast_functions(MathesarCustomType.URI, type_body_map, engine)


def create_numeric_casts(engine):
    numeric_array_create = _build_numeric_array_function()
    with engine.begin() as conn:
        conn.execute(text(numeric_array_create))
    type_body_map = _get_numeric_type_body_map()
    create_cast_functions(PostgresType.NUMERIC, type_body_map, engine)


# TODO find more descriptive name
def get_full_cast_map(engine):
    """
    Returns a mapping of source types to target type sets.
    """
    target_to_source_maps = {
        PostgresType.BIGINT: _get_integer_type_body_map(target_type=PostgresType.BIGINT),
        PostgresType.BOOLEAN: _get_boolean_type_body_map(),
        PostgresType.CHARACTER: _get_textual_type_body_map(engine),
        PostgresType.CHARACTER_VARYING: _get_textual_type_body_map(engine),
        PostgresType.DATE: _get_date_type_body_map(),
        PostgresType.JSON: _get_json_type_body_map(target_type=PostgresType.JSON),
        PostgresType.JSONB: _get_json_type_body_map(target_type=PostgresType.JSONB),
        MathesarCustomType.MATHESAR_JSON_ARRAY: _get_json_type_body_map(target_type=MathesarCustomType.MATHESAR_JSON_ARRAY),
        MathesarCustomType.MATHESAR_JSON_OBJECT: _get_json_type_body_map(target_type=MathesarCustomType.MATHESAR_JSON_OBJECT),
        PostgresType.DOUBLE_PRECISION: _get_decimal_number_type_body_map(target_type=PostgresType.DOUBLE_PRECISION),
        MathesarCustomType.EMAIL: _get_email_type_body_map(),
        PostgresType.INTEGER: _get_integer_type_body_map(target_type=PostgresType.INTEGER),
        MathesarCustomType.MATHESAR_MONEY: _get_mathesar_money_type_body_map(),
        PostgresType.MONEY: _get_money_type_body_map(),
        MathesarCustomType.MULTICURRENCY_MONEY: _get_multicurrency_money_type_body_map(),
        PostgresType.INTERVAL: _get_interval_type_body_map(),
        PostgresType.NUMERIC: _get_decimal_number_type_body_map(target_type=PostgresType.NUMERIC),
        PostgresType.REAL: _get_decimal_number_type_body_map(target_type=PostgresType.REAL),
        PostgresType.SMALLINT: _get_integer_type_body_map(target_type=PostgresType.SMALLINT),
        PostgresType.TIME_WITHOUT_TIME_ZONE: _get_time_type_body_map(PostgresType.TIME_WITHOUT_TIME_ZONE),
        PostgresType.TIME_WITH_TIME_ZONE: _get_time_type_body_map(PostgresType.TIME_WITH_TIME_ZONE),
        PostgresType.TIMESTAMP_WITH_TIME_ZONE: _get_timestamp_with_timezone_type_body_map(PostgresType.TIMESTAMP_WITH_TIME_ZONE),
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: _get_timestamp_without_timezone_type_body_map(),
        PostgresType.TEXT: _get_textual_type_body_map(engine),
        MathesarCustomType.URI: _get_uri_type_body_map(),
    }
    # invert the map
    source_to_target_tuples = (
        (source, target)
        for target in target_to_source_maps
        for source in target_to_source_maps[target]
    )
    # reduce (source, target) tuples to a dictionary of sets
    source_to_target_sets = {}
    for source, target in source_to_target_tuples:
        source_to_target_sets.setdefault(source, set()).add(target)
    # freeze the collections
    return frozendict(
        {
            source: frozenset(target_set)
            for source, target_set
            in source_to_target_sets.items()
        }
    )


def create_cast_functions(target_type, type_body_map, engine):
    """
    This python function writes a number of PL/pgSQL functions that cast
    between types supported by Mathesar, and installs them on the DB
    using the given engine.  Each generated PL/pgSQL function has the
    name `cast_to_<target_type>`.  We utilize the function overloading of
    PL/pgSQL to use the correct function body corresponding to a given
    input (source) type.

    Args:
        target_type:   Enum corresponding to the target type of the
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
    CREATE OR REPLACE FUNCTION {function_name}({argument_type.id})
    RETURNS {target_type.id}
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
    unqualified_type_name = target_type.id.split('.')[-1].lower()
    if '(' in unqualified_type_name:
        bare_type_name = unqualified_type_name[:unqualified_type_name.find('(')]
        if unqualified_type_name[-1] != ')':
            bare_type_name += unqualified_type_name[unqualified_type_name.find(')') + 1:]
    else:
        bare_type_name = unqualified_type_name
    function_type_name = '_'.join(bare_type_name.split())
    bare_function_name = f"cast_to_{function_type_name}"
    escaped_bare_function_name = _escape_illegal_characters(bare_function_name)
    qualified_escaped_bare_function_name = get_qualified_name(escaped_bare_function_name)
    return qualified_escaped_bare_function_name


def _escape_illegal_characters(sql_name):
    replacement_mapping = {
        '"': '_double_quote_'
    }
    resulting_string = sql_name
    for old, new in replacement_mapping.items():
        resulting_string = resulting_string.replace(old, new)
    return resulting_string


def _get_json_type_body_map(target_type):
    """
    Allow casting from text, primitive json types and Mathesar custom json types.
    Target types include primitive json, jsonb, Mathesar json object and Mathesar json array
    """
    default_behavior_source_types = categories.STRING_TYPES | frozenset([PostgresType.JSON, PostgresType.JSONB, MathesarCustomType.MATHESAR_JSON_ARRAY, MathesarCustomType.MATHESAR_JSON_OBJECT])
    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, target_type
    )

    return type_body_map


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
    source_number_types = categories.NUMERIC_TYPES
    source_text_types = categories.STRING_TYPES
    default_behavior_source_types = frozenset([PostgresType.BOOLEAN])

    not_bool_exception_str = f"RAISE EXCEPTION '% is not a {PostgresType.BOOLEAN.id}', $1;"

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
        istrue {PostgresType.BOOLEAN.id};
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
        default_behavior_source_types, PostgresType.BOOLEAN,
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
    identity_set = {MathesarCustomType.EMAIL}
    default_behavior_source_types = categories.STRING_TYPES
    source_types = default_behavior_source_types.union(identity_set)
    return _get_default_type_body_map(
        source_types, MathesarCustomType.EMAIL,
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
    source_text_types = categories.STRING_TYPES

    def _get_text_interval_type_body_map():
        # We need to check that a string isn't a valid number before
        # casting to intervals (since a number is more likely)
        return f""" BEGIN
          PERFORM $1::{PostgresType.NUMERIC.id};
          RAISE EXCEPTION '% is a {PostgresType.NUMERIC.id}', $1;
          EXCEPTION
            WHEN sqlstate '22P02' THEN
              RETURN $1::{PostgresType.INTERVAL.id};
        END;
        """

    type_body_map = {
        PostgresType.INTERVAL: """
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


def _get_integer_type_body_map(target_type=PostgresType.INTEGER):
    """
    We use default behavior for identity and casts from TEXT types.
    We specifically disallow rounding or truncating when casting from numerics,
    etc.
    """
    default_behavior_source_types = categories.INTEGER_TYPES | categories.STRING_TYPES
    no_rounding_source_types = categories.DECIMAL_TYPES | categories.MONEY_WITHOUT_CURRENCY_TYPES | frozenset([PostgresType.NUMERIC])
    target_type_str = target_type.id
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
        default_behavior_source_types, target_type,
    )
    type_body_map.update(
        {
            type_name: _get_no_rounding_cast_to_integer()
            for type_name in no_rounding_source_types
        }
    )
    type_body_map.update({PostgresType.BOOLEAN: _get_boolean_to_number_cast(target_type)})
    return type_body_map


def _get_decimal_number_type_body_map(target_type=PostgresType.NUMERIC):
    """
    Get SQL strings that create various functions for casting different
    types to number types including DECIMAL, DOUBLE PRECISION, FLOAT,
    NUMERIC, and REAL.

    The only notable non-default cast is from boolean:
        boolean -> number:  We cast TRUE -> 1, FALSE -> 0
    """

    default_behavior_source_types = (
        categories.NUMERIC_TYPES | categories.STRING_TYPES | categories.MONEY_WITHOUT_CURRENCY_TYPES
    )
    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, target_type,
    )
    type_body_map.update({PostgresType.BOOLEAN: _get_boolean_to_number_cast(target_type)})
    return type_body_map


def _get_boolean_to_number_cast(target_type):
    target_type_str = target_type.id
    return f"""
    BEGIN
      IF $1 THEN
        RETURN 1::{target_type_str};
      END IF;
      RETURN 0::{target_type_str};
    END;
    """


def _get_time_type_body_map(target_type):
    default_behavior_source_types = [
        PostgresType.TEXT, PostgresType.CHARACTER_VARYING, PostgresType.TIME_WITHOUT_TIME_ZONE, PostgresType.TIME_WITH_TIME_ZONE
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
    default_behavior_source_types = categories.DATETIME_TYPES | categories.STRING_TYPES
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
    source_text_types = categories.STRING_TYPES
    source_datetime_types = frozenset([PostgresType.TIMESTAMP_WITH_TIME_ZONE, PostgresType.DATE])
    default_behavior_source_types = frozenset([PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE])

    not_timestamp_without_tz_exception_str = (
        f"RAISE EXCEPTION '% is not a {PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE.id}', $1;"
    )
    # Check if the value is missing timezone by casting it to a timestamp
    # with timezone and comparing if the value is equal to a timestamp
    # without timezone.
    timestamp_without_tz_condition_str = f"""
            IF (timestamp_value_with_tz = timestamp_value) THEN
            RETURN $1::{PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE.id};
            END IF;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
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
    money_array_function = get_qualified_name(MONEY_ARR_FUNC_NAME)
    default_behavior_source_types = frozenset([MathesarCustomType.MATHESAR_MONEY])
    number_types = categories.NUMERIC_TYPES
    textual_types = categories.STRING_TYPES | frozenset([PostgresType.MONEY])
    cast_exception_str = (
        f"RAISE EXCEPTION '% cannot be cast to {MathesarCustomType.MATHESAR_MONEY.id}', $1;"
    )

    def _get_number_cast_to_money():
        return f"""
        BEGIN
          RETURN $1::numeric::{MathesarCustomType.MATHESAR_MONEY.id};
        END;
        """

    def _get_base_textual_cast_to_money():
        return rf"""
        DECLARE decimal_point {PostgresType.TEXT.id};
        DECLARE is_negative {PostgresType.BOOLEAN.id};
        DECLARE money_arr {PostgresType.TEXT.id}[];
        DECLARE money_num {PostgresType.TEXT.id};
        BEGIN
          SELECT {money_array_function}($1::{PostgresType.TEXT.id}) INTO money_arr;
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
            RETURN ('-' || money_num)::{MathesarCustomType.MATHESAR_MONEY.id};
          END IF;
          RETURN money_num::{MathesarCustomType.MATHESAR_MONEY.id};
        END;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, MathesarCustomType.MATHESAR_MONEY,
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
    qualified_function_name = get_qualified_name(MONEY_ARR_FUNC_NAME)

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

    text_db_type_id = PostgresType.TEXT.id
    return rf"""
    CREATE OR REPLACE FUNCTION {qualified_function_name}({text_db_type_id}) RETURNS {text_db_type_id}[]
    AS $$
      DECLARE
        raw_arr {text_db_type_id}[];
        actual_number_arr {text_db_type_id}[];
        group_divider_arr {text_db_type_id}[];
        decimal_point_arr {text_db_type_id}[];
        actual_number {text_db_type_id};
        group_divider {text_db_type_id};
        decimal_point {text_db_type_id};
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
    default_behavior_source_types = frozenset([PostgresType.MONEY, MathesarCustomType.MATHESAR_MONEY])
    number_types = categories.NUMERIC_TYPES
    textual_types = categories.STRING_TYPES
    cast_loss_exception_str = (
        f"RAISE EXCEPTION '% cannot be cast to {PostgresType.MONEY.id} as currency symbol is missing', $1;"
    )

    def _get_number_cast_to_money():
        return f"""
        BEGIN
          RETURN $1::numeric::{PostgresType.MONEY.id};
        END;
        """

    def _get_base_textual_cast_to_money():
        return f"""
        DECLARE currency {PostgresType.TEXT.id};
        BEGIN
          SELECT to_char(1, 'L') INTO currency;
          IF ($1 LIKE '%' || currency) OR ($1 LIKE currency || '%') THEN
            RETURN $1::{PostgresType.MONEY.id};
          END IF;
          {cast_loss_exception_str}
        END;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, PostgresType.MONEY,
    )
    type_body_map.update(
        {
            db_type: _get_number_cast_to_money()
            for db_type in number_types
        }
    )
    type_body_map.update(
        {
            db_type: _get_base_textual_cast_to_money()
            for db_type in textual_types
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
    default_behavior_source_types = [MathesarCustomType.MULTICURRENCY_MONEY]
    number_types = categories.NUMERIC_TYPES | frozenset([MathesarCustomType.MATHESAR_MONEY])
    textual_types = categories.STRING_TYPES | frozenset([PostgresType.MONEY])

    def _get_number_cast_to_money():
        return f"""
        BEGIN
          RETURN ROW($1, 'USD')::{MathesarCustomType.MULTICURRENCY_MONEY.id};
        END;
        """

    def _get_base_textual_cast_to_money():
        return f"""
        BEGIN
          RETURN ROW($1::numeric, 'USD')::{MathesarCustomType.MULTICURRENCY_MONEY.id};
        END;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, MathesarCustomType.MULTICURRENCY_MONEY,
    )
    type_body_map.update(
        {
            db_type: _get_number_cast_to_money()
            for db_type in number_types
        }
    )
    type_body_map.update(
        {
            db_type: _get_base_textual_cast_to_money()
            for db_type in textual_types
        }
    )
    return type_body_map


def _get_textual_type_body_map(engine):
    """
    Get SQL strings that create various functions for casting different
    types to text types through the TEXT type.

    All casts to varchar use default PostgreSQL behavior.
    All types in get_supported_alter_column_types are supported.
    """
    supported_types = get_available_known_db_types(engine)
    # We cast everything through TEXT so that formatting is done correctly
    # for CHAR.
    text_cast_str = f"""
        BEGIN
          RETURN $1::{PostgresType.TEXT.id};
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
    source_text_types = categories.STRING_TYPES
    source_datetime_types = frozenset([PostgresType.TIMESTAMP_WITH_TIME_ZONE, PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE])
    default_behavior_source_types = frozenset([PostgresType.DATE])

    not_date_exception_str = f"RAISE EXCEPTION '% is not a {PostgresType.DATE.id}', $1;"
    date_condition_str = f"""
            IF (timestamp_value_with_tz = date_value) THEN
            RETURN $1::{PostgresType.DATE.id};
            END IF;
        """

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, PostgresType.TIMESTAMP_WITH_TIME_ZONE
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
        auth_func = uri.URIFunction.AUTHORITY.value
        tld_regex = r"'(?<=\.)(?:.(?!\.))+$'"
        not_uri_exception_str = f"RAISE EXCEPTION '% is not a {MathesarCustomType.URI.id}', $1;"
        return f"""
        DECLARE uri_res {MathesarCustomType.URI.id} := 'https://centerofci.org';
        DECLARE uri_tld {PostgresType.TEXT.id};
        BEGIN
          RETURN $1::{MathesarCustomType.URI.id};
          EXCEPTION WHEN SQLSTATE '23514' THEN
              SELECT lower(('http://' || $1)::{MathesarCustomType.URI.id}) INTO uri_res;
              SELECT (regexp_match({auth_func}(uri_res), {tld_regex}))[1]
                INTO uri_tld;
              IF EXISTS(SELECT 1 FROM {uri.QUALIFIED_TLDS} WHERE tld = uri_tld) THEN
                RETURN uri_res;
              END IF;
          {not_uri_exception_str}
        END;
        """

    source_types = frozenset([MathesarCustomType.URI]) | categories.STRING_TYPES
    return {type_: _get_text_uri_type_body_map() for type_ in source_types}


def _get_numeric_type_body_map():
    """
    Get SQL strings that create various functions for casting different
    types to numeric.
    We allow casting any textual type to locale-agnostic numeric.
    """
    default_behavior_source_types = categories.NUMERIC_TYPES | frozenset([PostgresType.MONEY])
    text_source_types = categories.STRING_TYPES

    type_body_map = _get_default_type_body_map(
        default_behavior_source_types, PostgresType.NUMERIC
    )
    type_body_map.update(
        {
            text_type: _get_text_to_numeric_cast()
            for text_type in text_source_types
        }
    )
    type_body_map.update({PostgresType.BOOLEAN: _get_boolean_to_number_cast(PostgresType.NUMERIC)})
    return type_body_map


def _get_text_to_numeric_cast():
    text_db_type_id = PostgresType.TEXT.id
    numeric_db_type_id = PostgresType.NUMERIC.id

    numeric_array_function = get_qualified_name(NUMERIC_ARR_FUNC_NAME)
    cast_exception_str = (
        f"RAISE EXCEPTION '% cannot be cast to {PostgresType.NUMERIC}', $1;"
    )
    return rf"""
    DECLARE decimal_point {text_db_type_id};
    DECLARE is_negative {PostgresType.BOOLEAN.id};
    DECLARE numeric_arr {text_db_type_id}[];
    DECLARE numeric {text_db_type_id};
    BEGIN
        SELECT {numeric_array_function}($1::{text_db_type_id}) INTO numeric_arr;
        IF numeric_arr IS NULL THEN
            {cast_exception_str}
        END IF;

        SELECT numeric_arr[1] INTO numeric;
        SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
        SELECT $1::text ~ '^-.*$' INTO is_negative;

        IF numeric_arr[2] IS NOT NULL THEN
            SELECT regexp_replace(numeric, numeric_arr[2], '', 'gq') INTO numeric;
        END IF;
        IF numeric_arr[3] IS NOT NULL THEN
            SELECT regexp_replace(numeric, numeric_arr[3], decimal_point, 'q') INTO numeric;
        END IF;
        IF is_negative THEN
            RETURN ('-' || numeric)::{numeric_db_type_id};
        END IF;
        RETURN numeric::{numeric_db_type_id};
    END;
    """


def _build_numeric_array_function():
    """
    The main reason for this function to be separate is for testing. This
    does have some performance impact; we should consider inlining later.
    """
    qualified_function_name = get_qualified_name(NUMERIC_ARR_FUNC_NAME)

    no_separator_big = r"[0-9]{4,}(?:([,.])[0-9]+)?"
    no_separator_small = r"[0-9]{1,3}(?:([,.])[0-9]{1,2}|[0-9]{4,})?"
    comma_separator_req_decimal = r"[0-9]{1,3}(,)[0-9]{3}(\.)[0-9]+"
    period_separator_req_decimal = r"[0-9]{1,3}(\.)[0-9]{3}(,)[0-9]+"
    comma_separator_opt_decimal = r"[0-9]{1,3}(?:(,)[0-9]{3}){2,}(?:(\.)[0-9]+)?"
    period_separator_opt_decimal = r"[0-9]{1,3}(?:(\.)[0-9]{3}){2,}(?:(,)[0-9]+)?"
    space_separator_opt_decimal = r"[0-9]{1,3}(?:( )[0-9]{3})+(?:([,.])[0-9]+)?"
    comma_separator_lakh_system = r"[0-9]{1,2}(?:(,)[0-9]{2})+,[0-9]{3}(?:(\.)[0-9]+)?"
    single_quote_separator_opt_decimal = r"[0-9]{1,3}(?:(\'')[0-9]{3})+(?:([.])[0-9]+)?"

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
            single_quote_separator_opt_decimal
        ])
    numeric_finding_regex = f"^(?:[+-]?({inner_number_tree}))$"

    actual_number_indices = [1]
    group_divider_indices = [4, 6, 8, 10, 12, 14, 16]
    decimal_point_indices = [2, 3, 5, 7, 9, 11, 13, 15, 17]
    actual_numbers_str = ','.join([f'raw_arr[{idx}]' for idx in actual_number_indices])
    group_dividers_str = ','.join([f'raw_arr[{idx}]' for idx in group_divider_indices])
    decimal_points_str = ','.join([f'raw_arr[{idx}]' for idx in decimal_point_indices])

    text_db_type_id = PostgresType.TEXT.id
    return rf"""
    CREATE OR REPLACE FUNCTION {qualified_function_name}({text_db_type_id}) RETURNS {text_db_type_id}[]
    AS $$
      DECLARE
        raw_arr {text_db_type_id}[];
        actual_number_arr {text_db_type_id}[];
        group_divider_arr {text_db_type_id}[];
        decimal_point_arr {text_db_type_id}[];
        actual_number {text_db_type_id};
        group_divider {text_db_type_id};
        decimal_point {text_db_type_id};
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


def _get_default_type_body_map(source_types, target_type):
    default_cast_str = f"""
        BEGIN
          RETURN $1::{target_type.id};
        END;
    """
    return {db_type: default_cast_str for db_type in source_types}
