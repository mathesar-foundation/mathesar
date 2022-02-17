"""
Here we define DBFunction subclasses that are equivalent of some combination of other DBFunction
subclasses (in other words, subclasses defined here are redundant). We do this to workaround
Mathesar filters not supporting composition.
"""

from abc import abstractmethod

from db.functions.base import DBFunction, Or, Lesser, Equal, Greater

from db.functions import hints


class RedundantDBFunction(DBFunction):
    """
    A DBFunction that is meant to be unpacked into another DBFunction. A way to define a DBFunction
    as a combination of DBFunctions. Its to_sa_expression method is not to used. Its concrete
    implementations are expected to implement the unpack method.
    """
    @staticmethod
    def to_sa_expression(*_):
        raise Exception("UnpackabelDBFunction.to_sa_expression should never be used.")

    @abstractmethod
    def unpack(self):
        """
        Should return a DBFunction instance with self.parameters forwarded to it. A way to define
        a DBFunction in terms of other DBFunctions.
        """
        pass


class LesserOrEqual(RedundantDBFunction):
    id = 'lesser_or_equal'
    name = 'is lesser or equal to'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Or([
            Lesser([param0, param1]),
            Equal([param0, param1]),
        ])


class GreaterOrEqual(DBFunction):
    id = 'greater_or_equal'
    name = 'is greater or equal to'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.all_parameters(hints.comparable),
        hints.mathesar_filter,
    ])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Or([
            Greater([param0, param1]),
            Equal([param0, param1]),
        ])
