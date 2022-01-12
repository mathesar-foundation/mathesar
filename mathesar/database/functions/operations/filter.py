from mathesar.database.functions.base import Function
from db.filters.base import ReferencedColumnsDontExist


def filter_with_db_function(query, db_function: Function):
    _assert_that_all_referenced_columns_exist(query, db_function)
    sa_expression = _db_function_to_sa_expression(db_function)
    query = query.filter(sa_expression)
    return query


def _assert_that_all_referenced_columns_exist(query, db_function: Function):
    columns_that_exist = set(column.name for column in query.selected_columns)
    referenced_columns = db_function.referenced_columns
    referenced_columns_that_dont_exist = \
        set.difference(referenced_columns, columns_that_exist)
    if len(referenced_columns_that_dont_exist) > 0:
        raise ReferencedColumnsDontExist(str(referenced_columns_that_dont_exist))


def _db_function_to_sa_expression(db_function: Function):
    """A DB function is considered to be either a Function subclass or a literal."""
    if isinstance(db_function, Function):
        raw_parameters = db_function.parameters
        parameters = [
            _db_function_to_sa_expression(raw_parameter)
            for raw_parameter in raw_parameters
        ]
        db_function_subclass = type(db_function)
        return db_function_subclass.to_sa_expression(*parameters)
    else:
        return db_function
