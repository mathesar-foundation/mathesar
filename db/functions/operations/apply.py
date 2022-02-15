from db.functions.base import DBFunction
from db.functions.exceptions import ReferencedColumnsDontExist
from db.functions.operations.deserialize import get_db_function_from_ma_function_spec


def apply_ma_function_spec_as_filter(relation, ma_function_spec):
    db_function = get_db_function_from_ma_function_spec(ma_function_spec)
    return apply_db_function_as_filter(relation, db_function)


def apply_db_function_as_filter(relation, db_function):
    _assert_that_all_referenced_columns_exist(relation, db_function)
    sa_expression = _db_function_to_sa_expression(db_function)
    relation = relation.filter(sa_expression)
    return relation


# Irrelevant when column ids are used. Still relevant if just column names were used.
def _assert_that_all_referenced_columns_exist(relation, db_function):
    columns_that_exist = _get_columns_that_exist(relation)
    referenced_columns = db_function.referenced_columns
    referenced_columns_that_dont_exist = \
        set.difference(referenced_columns, columns_that_exist)
    if len(referenced_columns_that_dont_exist) > 0:
        raise ReferencedColumnsDontExist(
            "These referenced columns don't exist on the relevant relation: "
            + f"{referenced_columns_that_dont_exist}"
        )


def _get_columns_that_exist(relation):
    columns = relation.selected_columns
    return set(column.name for column in columns)


def _db_function_to_sa_expression(db_function):
    """
    Takes a DBFunction, looks at the tree of its parameters (and the parameters of nested
    DBFunctions), and turns it into an SQLAlchemy expression. Each parameter is expected to either
    be a DBFunction instance or a literal primitive.
    """
    if isinstance(db_function, DBFunction):
        raw_parameters = db_function.parameters
        parameters = [
            _db_function_to_sa_expression(raw_parameter)
            for raw_parameter in raw_parameters
        ]
        db_function_subclass = type(db_function)
        return db_function_subclass.to_sa_expression(*parameters)
    else:
        return db_function
