import pytest
from db.transforms.operations.apply import apply_transformations
from db.transforms import base as transforms_base
from db.records.operations.select import get_records


@pytest.mark.parametrize(
    "transformations, expected_record_length",
    [
        [
            [
                transforms_base.Order(
                    spec=[],
                )
            ],
            2
        ]
    ]
)
def test_transformations(json_without_pkey_table_obj, transformations, expected_record_length):
    table, engine = json_without_pkey_table_obj
    relation = apply_transformations(table, transformations)
    records = get_records(relation, engine)
    assert len(records) == expected_record_length