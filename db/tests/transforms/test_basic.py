import pytest

from db.transforms.operations.apply import apply_transformations
from db.transforms import base as transforms_base
from db.records.operations.select import get_records


@pytest.mark.parametrize(
    "transformations,expected_records",
    [
        [
            [
                transforms_base.Filter(
                    spec=dict(
                        contains=[
                            dict(column_name=["Student Name"]),
                            dict(literal=["son"]),
                        ]
                    ),
                ),
                transforms_base.Order(
                    spec=[{"field": "Teacher Email", "direction": "asc"}],
                ),
                transforms_base.Limit(
                    spec=5,
                ),
                transforms_base.SelectSubsetOfColumns(
                    spec=["id"],
                ),
            ],
            [
                (978,),
                (194,),
                (99,),
                (155,),
                (192,),
            ]
        ],
        [
            [
                transforms_base.Limit(
                    spec=50,
                ),
                transforms_base.Filter(
                    spec=dict(
                        contains=[
                            dict(column_name=["Student Name"]),
                            dict(literal=["son"]),
                        ]
                    ),
                ),
                transforms_base.Order(
                    spec=[{"field": "Teacher Email", "direction": "asc"}],
                ),
                transforms_base.Limit(
                    spec=5,
                ),
                transforms_base.SelectSubsetOfColumns(
                    spec=["id"],
                ),
            ],
            [
                (31,),
                (16,),
                (18,),
                (24,),
                (33,),
            ]
        ],
        [
            [
                transforms_base.Limit(
                    spec=1,
                ),
                transforms_base.SelectSubsetOfColumns(
                    spec=["id", "Grade"],
                ),
                transforms_base.HideColumns(
                    spec=["Grade"],
                ),
            ],
            [
                (1,),
            ]
        ],
    ]
)
def test_transformations(roster_table_obj, transformations, expected_records):
    roster, engine = roster_table_obj
    relation = apply_transformations(roster, transformations)
    records = get_records(relation, engine)
    assert records == expected_records
