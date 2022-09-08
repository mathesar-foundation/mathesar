from sqlalchemy import text
from sqlalchemy import String
from sqlalchemy import func, not_
from sqlalchemy.dialects.postgresql import JSONB as SA_JSONB
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.compiler import compiles
from db.functions import hints
from db.functions.base import DBFunction, Equal, Greater, Lesser
from db.types.base import MathesarCustomType
from db.functions.packed import DBFunctionPacked, GreaterOrEqual, LesserOrEqual

DB_TYPE = MathesarCustomType.MATHESAR_JSON_OBJECT.id


class MathesarJsonObject(TypeDecorator):
    impl = SA_JSONB
    cache_ok = True

    def get_col_spec(self, **_):
        return DB_TYPE.upper()

    def column_expression(self, column):
        return func.cast(column, String)

    def coerce_compared_value(self, op, value):
        return self.impl.coerce_compared_value(op, value)


@compiles(MathesarJsonObject, 'postgresql')
def _compile_mathesarjsonobject(element, compiler, **kw):
    unchanged_compiled_string = compiler.visit_JSONB(element, **kw)
    unchanged_id = "JSONB"
    changed_id = MathesarCustomType.MATHESAR_JSON_OBJECT.id.upper()
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string


def install(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """
    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS JSONB CHECK (jsonb_typeof(VALUE) = 'object');
    """
    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_domain_query))
        conn.commit()


class JsonObjectContains(DBFunction):
    id = 'json_object_contains'
    name = 'object contains'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_object),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return func.jsonb_contains(value1, func.cast(value2, SA_JSONB))


class JsonObjectNotContains(DBFunction):
    id = 'json_object_not_contains'
    name = 'object not contains'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_object),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return not_(func.jsonb_contains(value1, func.cast(value2, SA_JSONB)))


class JsonObjectExistsKey(DBFunction):
    id = 'json_object_exists'
    name = 'object exists key'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_object),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return func.jsonb_exists(value1, value2)


class JsonObjectNotExistsKey(DBFunction):
    id = 'json_object_not_exists'
    name = 'object not exists key'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_object),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return not_(func.jsonb_exists(value1, value2))


class JsonObjectLength(DBFunction):
    id = 'json_object_length'
    name = 'object length'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(1),
        hints.parameter(0, hints.json_object),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value):
        return func.array_length(func.array_agg(func.jsonb_object_keys(value)))


class JsonObjectLengthEquals(DBFunctionPacked):
    id = 'json_object_length_equals'
    name = 'Number of keys is'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_object),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Equal([
            JsonObjectLength([param0]),
            param1,
        ])
