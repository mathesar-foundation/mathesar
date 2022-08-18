from sqlalchemy import text
from sqlalchemy import String
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB as SA_JSONB
from sqlalchemy.types import TypeDecorator
from db.types.base import MathesarCustomType
from sqlalchemy.ext.compiler import compiles

from db.functions import hints
from db.functions.base import DBFunction, Equal, Greater, Lesser
from db.functions.packed import DBFunctionPacked, GreaterOrEqual, LesserOrEqual

DB_TYPE = MathesarCustomType.MATHESAR_JSON_ARRAY.id


class MathesarJsonArray(TypeDecorator):
    impl = SA_JSONB
    cache_ok = True

    def get_col_spec(self, **_):
        return DB_TYPE.upper()

    def column_expression(self, column):
        return func.cast(column, String)

    def coerce_compared_value(self, op, value):
        return self.impl.coerce_compared_value(op, value)


@compiles(MathesarJsonArray, 'postgresql')
def _compile_mathesarjsonobject(element, compiler, **kw):
    unchanged_compiled_string = compiler.visit_JSONB(element, **kw)
    unchanged_id = "JSONB"
    changed_id = MathesarCustomType.MATHESAR_JSON_ARRAY.id.upper()
    changed_compiled_string = unchanged_compiled_string.replace(unchanged_id, changed_id)
    return changed_compiled_string


def install(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """
    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS JSONB CHECK (jsonb_typeof(VALUE) = 'array');
    """

    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_domain_query))
        conn.commit()


class ArrayLength(DBFunction):
    id = 'array_length'
    name = 'length'
    hints = tuple([
        hints.returns(hints.comparable),
        hints.parameter_count(1),
        hints.parameter(0, hints.json_array),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value):
        return func.jsonb_array_length(value)


class LengthEquals(DBFunctionPacked):
    id = 'json_array_length_equals'
    name = 'Number of elements is'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_array),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Equal([
            ArrayLength([param0]),
            param1,
        ])


class LengthGreaterThan(DBFunctionPacked):
    id = 'json_array_length_greater_than'
    name = 'number of elements >'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_array),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Greater([
            ArrayLength([param0]),
            param1,
        ])


class LengthGreaterorEqual(DBFunctionPacked):
    id = 'json_array_length_greater_or_equal'
    name = 'Number of elements >='
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_array),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return GreaterOrEqual([
            ArrayLength([param0]),
            param1,
        ])


class LengthLessThan(DBFunctionPacked):
    id = 'json_array_length_less_than'
    name = 'Number of elements <'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_array),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Lesser([
            ArrayLength([param0]),
            param1,
        ])


class LengthLessorEqual(DBFunctionPacked):
    id = 'json_array_length_less_or_equal'
    name = 'Number of elements <='
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_array),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return LesserOrEqual([
            ArrayLength([param0]),
            param1,
        ])


class IsNotEmpty(DBFunctionPacked):
    id = 'json_array_not_empty'
    name = 'Is not empty'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(1),
        hints.parameter(0, hints.json_array),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        return Greater([
            ArrayLength([param0]),
            0,
        ])


class ArrayContains(DBFunctionPacked):
    id = 'json_array_contains'
    name = 'contains'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.json_array),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = func.cast(func.concat('[', self.parameters[1], ']'), SA_JSONB)
        return func.jsonb_contains(param0, param1)


