from db.filters.operations.deserialize import get_predicate_from_MA_filter_spec
from db.filters.base import Predicate, ReferencedColumnsDontExist


def apply_ma_filter_spec(query, ma_filter_spec: dict):
    predicate = get_predicate_from_MA_filter_spec(ma_filter_spec)
    query = apply_ma_predicate(query, predicate)
    return query


def apply_ma_predicate(query, predicate: Predicate):
    _assert_that_all_referenced_columns_exist(query, predicate)
    sa_filter = predicate.to_sa_filter()
    query = query.filter(sa_filter)
    return query


def _assert_that_all_referenced_columns_exist(query, predicate: Predicate):
    columns_that_exist = set(column.name for column in query.selected_columns)
    referenced_columns = predicate.referenced_columns
    referenced_columns_that_dont_exist = \
        set.difference(referenced_columns, columns_that_exist)
    if len(referenced_columns_that_dont_exist) > 0:
        raise ReferencedColumnsDontExist(str(referenced_columns_that_dont_exist))
