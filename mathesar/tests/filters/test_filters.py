from mathesar.filters.base import get_available_filters

def test_(test_db_model):
    engine = test_db_model._sa_engine
    available_filters = get_available_filters(engine)
    assert len(available_filters) > 3
    available_filter_ids = tuple(filter['id'] for filter in available_filters)
    assert set.issubset(set(['greater','lesser']), available_filter_ids)
    breakpoint()

