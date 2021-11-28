import pytest

from db.filters.operations.serialize import getSAFilterSpecFromPredicate
from db.filters.base import And, Or, Not, Equal, Empty, In

def test_serialization():
    predicate = And([
        Or([
            In(column="col3", parameters=["value31","value32"]),
            Equal(column="col2",parameter="value2"),
        ]),
        Not(
            Empty(column="col1")
        ),
    ])
    expectedSAFilterSpec = {'and': [
        {'or': [
            {'field': 'col3', 'op': 'in', 'value': ['value31', 'value32']},
            {'field': 'col2', 'op': 'eq', 'value': 'value2'}
        ]},
        {'not': [{'field': 'col1', 'op': 'is_null'}]}
    ]}
    saFilterSpec = getSAFilterSpecFromPredicate(predicate)
    assert saFilterSpec == expectedSAFilterSpec
