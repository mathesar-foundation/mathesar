from mathesar.filters.base import get_available_filters


def test_available_filters_structure(engine_with_schema):
    engine, _ = engine_with_schema
    available_filters = get_available_filters(engine)
    assert len(available_filters) > 0
    available_filter_ids = tuple(filter['id'] for filter in available_filters)
    some_filters_that_we_expect_to_be_there = [
        'greater',
        'lesser',
        'null',
        'not_null',
        'equal',
        'greater_or_equal',
        'contains_case_insensitive',
        'starts_with_case_insensitive',
        'uri_authority_contains',
        'uri_scheme_equals',
        'email_domain_contains',
        'email_domain_equals',
        'json_array_length_equals',
    ]

    for expected_filter in some_filters_that_we_expect_to_be_there:
        assert expected_filter in available_filter_ids

    for filter in available_filters:
        for parameter in filter['parameters']:
            assert len(parameter['ui_types']) > 0
