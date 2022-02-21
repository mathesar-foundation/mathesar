from mathesar.filters.base import get_available_filters


def test_available_filters_structure(empty_nasa_table):
    engine = empty_nasa_table._sa_engine
    available_filters = get_available_filters(engine)
    assert len(available_filters) > 0
    available_filter_ids = tuple(filter['id'] for filter in available_filters)
    some_filters_that_we_expect_to_be_there = [
        'greater',
        'lesser',
        'empty',
        'equal',
        'greater_or_equal',
        'starts_with',
        'contains',
        'uri_authority_contains',
        'uri_scheme_equals',
        'email_domain_contains',
        'email_domain_equals',
    ]
    expected_filters_are_available = set.issubset(
        set(some_filters_that_we_expect_to_be_there),
        available_filter_ids
    )
    assert expected_filters_are_available
    all_filter_parameters_have_at_least_one_mathesar_type_defined = all(
        len(parameter['ui_types']) > 0
        for filter in available_filters
        for parameter in filter['parameters']
    )
    assert all_filter_parameters_have_at_least_one_mathesar_type_defined
