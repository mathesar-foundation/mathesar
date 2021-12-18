from db.filters.operations.deserialize import get_predicate_from_MA_filter_spec
from db.filters.base import Predicate


def apply_ma_filter_spec(query, ma_filter_spec: dict):
    predicate = get_predicate_from_MA_filter_spec(ma_filter_spec)
    query = apply_ma_predicate(query, predicate)
    return query


def apply_ma_predicate(query, predicate: Predicate):
    sa_filter = predicate.to_sa_filter()
    query = query.filter(sa_filter)
    return query
