from db.filters.operations.deserialize import getPredicateFromMAFilterSpec
from db.filters.base import And, Or, Not, Equal, Empty, In

def test_deserialize():
    maFilterSpec = { "and": [
        {"not":
            {"empty": {"column": "col1"}}},
        {"or": [
            {"equal": {"column": "col2", "parameter": 15}},
            {"in": {"column": "col3", "parameters": [1,2,3]}},
        ]}]}
    expectedPredicate = And([
        Not(
            Empty(column="col1")
        ),
        Or([
            Equal(column="col2",parameter=15),
            In(column="col3", parameters=[1,2,3]),
        ]),
    ])
    predicate = getPredicateFromMAFilterSpec(maFilterSpec)
    assert predicate == expectedPredicate
