"""
Here we define DBFunction subclasses that are equivalent of some combination of other DBFunction
subclasses (in other words, subclasses defined here are redundant). We do this to workaround
Mathesar filters not supporting composition.
"""

from db.functions.base import DBFunction

from db.functions import hints


# TODO (tech debt) define in terms of other DBFunctions
# would involve creating an alternative to to_sa_expression: something like to_db_function
# execution engine would see that to_sa_expression is not implemented, and it would look for
# to_db_function.


class LesserOrEqual(DBFunction):
    id = 'lesser_or_equal'
    name = 'Lesser or Equal'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return value1 <= value2


class GreaterOrEqual(DBFunction):
    id = 'greater_or_equal'
    name = 'Greater or Equal'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
        hints.mathesar_filter,
    ])

    @staticmethod
    def to_sa_expression(value1, value2):
        return value1 >= value2
