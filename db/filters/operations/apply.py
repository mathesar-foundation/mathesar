from db.filters.operations.deserialize import get_predicate_from_MA_filter_spec
from db.filters.operations.serialize import get_SA_filter_spec_from_predicate
from sqlalchemy_filters import apply_filters


def apply_ma_filter_spec(query, ma_filter_spec):
    predicate = get_predicate_from_MA_filter_spec(ma_filter_spec)
    sa_filter_spec = get_SA_filter_spec_from_predicate(predicate)
    query = apply_filters(query, sa_filter_spec)
    return query
