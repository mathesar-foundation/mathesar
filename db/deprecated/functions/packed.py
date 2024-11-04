"""
Here we define DBFunction subclasses that are defined in terms of other DBFunction subclasses
(these DBFunctions are packages or combinations of other DBFunctions). We do this to workaround
Mathesar filters not supporting composition.
"""

from abc import abstractmethod

from db.deprecated.functions import base
from db.deprecated.types.custom import EMAIL_DOMAIN_NAME, URIFunction


class DBFunctionPacked(base.DBFunction):
    """
    A DBFunction that is meant to be unpacked into another DBFunction. A way to define a DBFunction
    as a combination of DBFunctions. Its to_sa_expression method is not used. Its concrete
    implementations are expected to implement the unpack method.
    """
    @staticmethod
    def to_sa_expression(*_):
        raise Exception("DBFunctionPacked.to_sa_expression should never be used.")

    @abstractmethod
    def unpack(self):
        """
        Should return a DBFunction instance with self.parameters forwarded to it. A way to define
        a DBFunction in terms of other DBFunctions.
        """
        pass


class DistinctArrayAgg(DBFunctionPacked):
    """
    These two functions together are meant to be a user-friendly alternative to plain array_agg.

    See: https://github.com/centerofci/mathesar/issues/2059
    """
    id = 'distinct_aggregate_to_array'
    name = 'distinct aggregate to array'

    def unpack(self):
        param0 = self.parameters[0]
        param0 = base._maybe_downcast(param0)
        return base.ArrayAgg([
            base.Distinct([param0]),
        ])


class NotNull(DBFunctionPacked):
    id = 'not_null'
    name = 'Is not null'

    def unpack(self):
        param0 = self.parameters[0]
        return base.Not([
            base.Null([param0]),
        ])


class LesserOrEqual(DBFunctionPacked):
    id = 'lesser_or_equal'
    name = 'is lesser or equal to'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Or([
            base.Lesser([param0, param1]),
            base.Equal([param0, param1]),
        ])


class GreaterOrEqual(DBFunctionPacked):
    id = 'greater_or_equal'
    name = 'is greater or equal to'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Or([
            base.Greater([param0, param1]),
            base.Equal([param0, param1]),
        ])


class ArrayLengthEquals(DBFunctionPacked):
    id = 'array_length_equals'
    name = 'Number of elements is'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        param2 = self.parameters[2]
        return base.Equal([
            base.ArrayLength([param0, param1]),
            param2
        ])


class ArrayLengthGreaterThan(DBFunctionPacked):
    id = 'array_length_greater_than'
    name = 'Number of elements is greater than'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        param2 = self.parameters[2]
        return base.Greater([
            base.ArrayLength([param0, param1]),
            param2
        ])


class ArrayLengthLessThan(DBFunctionPacked):
    id = 'array_length_lesser_than'
    name = 'Number of elements is lesser than'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        param2 = self.parameters[2]
        return base.Lesser([
            base.ArrayLength([param0, param1]),
            param2
        ])


class ArrayLengthGreaterOrEqual(DBFunctionPacked):
    id = 'array_length_greater_than_or_equal'
    name = 'Number of elements is greater than or equal to'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        param2 = self.parameters[2]
        return GreaterOrEqual([
            base.ArrayLength([param0, param1]),
            param2
        ])


class ArrayLengthLessOrEqual(DBFunctionPacked):
    id = 'array_length_lesser_than_or_equal'
    name = 'Number of elements is lesser than or equal to'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        param2 = self.parameters[2]
        return LesserOrEqual([
            base.ArrayLength([param0, param1]),
            param2
        ])


class ArrayNotEmpty(DBFunctionPacked):
    id = 'array_not_empty'
    name = 'Is not empty'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Greater([
            base.ArrayLength([param0, param1]),
            0,
        ])


class JsonLengthEquals(DBFunctionPacked):
    id = 'json_array_length_equals'
    name = 'Number of elements is'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Equal([
            base.JsonArrayLength([param0]),
            param1,
        ])


class JsonLengthGreaterThan(DBFunctionPacked):
    id = 'json_array_length_greater_than'
    name = 'Number of elements is greater than'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Greater([
            base.JsonArrayLength([param0]),
            param1,
        ])


class JsonLengthGreaterorEqual(DBFunctionPacked):
    id = 'json_array_length_greater_or_equal'
    name = 'Number of elements is greater than or equal to'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return GreaterOrEqual([
            base.JsonArrayLength([param0]),
            param1,
        ])


class JsonLengthLessThan(DBFunctionPacked):
    id = 'json_array_length_less_than'
    name = 'Number of elements is less than'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Lesser([
            base.JsonArrayLength([param0]),
            param1,
        ])


class JsonLengthLessorEqual(DBFunctionPacked):
    id = 'json_array_length_less_or_equal'
    name = 'Number of elements is less than or equal to'

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return LesserOrEqual([
            base.JsonArrayLength([param0]),
            param1,
        ])


class JsonNotEmpty(DBFunctionPacked):
    id = 'json_array_not_empty'
    name = 'Is not empty'

    def unpack(self):
        param0 = self.parameters[0]
        return base.Greater([
            base.JsonArrayLength([param0]),
            0,
        ])


class URIAuthorityContains(DBFunctionPacked):
    id = 'uri_authority_contains'
    name = 'URI authority contains'
    depends_on = tuple([URIFunction.AUTHORITY])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Contains([
            base.ExtractURIAuthority([param0]),
            param1,
        ])


class URISchemeEquals(DBFunctionPacked):
    id = 'uri_scheme_equals'
    name = 'URI scheme is'
    depends_on = tuple([URIFunction.SCHEME])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Equal([
            base.ExtractURIScheme([param0]),
            param1,
        ])


class EmailDomainContains(DBFunctionPacked):
    id = 'email_domain_contains'
    name = 'email domain contains'
    depends_on = tuple([EMAIL_DOMAIN_NAME])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Contains([
            base.ExtractEmailDomain([param0]),
            param1,
        ])


class EmailDomainEquals(DBFunctionPacked):
    id = 'email_domain_equals'
    name = 'email domain is'
    depends_on = tuple([EMAIL_DOMAIN_NAME])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return base.Equal([
            base.ExtractEmailDomain([param0]),
            param1,
        ])
