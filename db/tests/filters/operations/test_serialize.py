import pytest

from db.filters.operations.serialize import get_SA_filter_spec_from_predicate
from db.filters.base import And, Or, Not, Equal, Empty, In, StartsWith, EndsWith, Contains

valid_cases = [
    [
        And([
            Or([
                In(column="col3", parameters=["value31", "value32"]),
                Equal(column="col2", parameter="value2"),
            ]),
            Not(
                Empty(column="col1")
            ),
        ]),
        {'and': [
            {'or': [
                {'field': 'col3', 'op': 'in', 'value': ['value31', 'value32']},
                {'field': 'col2', 'op': 'eq', 'value': 'value2'}
            ]},
            {'not': [{'field': 'col1', 'op': 'is_null'}]}
        ]}
    ],
    [
        # Notice that escaping of _, % and \ is tested too:
        Or([
            StartsWith(column="col1", parameter="start_"),
            EndsWith(column="col1", parameter="end%"),
            Contains(column="col1", parameter="contained\\"),
        ]),
        {'or': [
            {'field': 'col1', 'op': 'like', 'value': 'start\\_%'},
            {'field': 'col1', 'op': 'like', 'value': '%end\\%'},
            {'field': 'col1', 'op': 'like', 'value': '%contained\\\\%'},
        ]}
    ],
]

@pytest.mark.parametrize("predicate, expected_SA_filter_spec", valid_cases)
def test_serialization(predicate, expected_SA_filter_spec):
    sa_filter_spec = get_SA_filter_spec_from_predicate(predicate)
    assert sa_filter_spec == expected_SA_filter_spec
