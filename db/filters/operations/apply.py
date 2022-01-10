from db.filters.operations.deserialize import get_expression_from_MA_filter_spec
from db.filters.base import Expression, ReferencedColumnsDontExist


def apply_ma_filter_spec(query, ma_filter_spec: dict):
    expression = get_expression_from_MA_filter_spec(ma_filter_spec)
    query = apply_ma_predicate(query, expression)
    return query


def apply_ma_predicate(query, expression):
    _assert_that_all_referenced_columns_exist(query, expression)
    sa_expression = _ma_expression_to_sa_expression(expression)
    query = query.filter(sa_expression)
    return query


def _assert_that_all_referenced_columns_exist(query, expression):
    columns_that_exist = set(column.name for column in query.selected_columns)
    referenced_columns = expression.referenced_columns
    referenced_columns_that_dont_exist = \
        set.difference(referenced_columns, columns_that_exist)
    if len(referenced_columns_that_dont_exist) > 0:
        raise ReferencedColumnsDontExist(str(referenced_columns_that_dont_exist))


def _ma_expression_to_sa_expression(expression):
    """An MA expression is considered to be either an Expression subclass or a literal."""
    if isinstance(expression, Expression):
        raw_parameters = expression.parameters
        parameters = [_ma_expression_to_sa_expression(raw_parameter) for raw_parameter in raw_parameters]
        expression_subclass = type(expression)
        return expression_subclass.to_sa_expression(*parameters)
    else:
        return expression
