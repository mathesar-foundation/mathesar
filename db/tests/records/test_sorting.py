import pytest

from sqlalchemy import MetaData, Table
from sqlalchemy_filters.exceptions import BadSortFormat, SortFieldNotFound

from db import records


ROSTER = "Roster"
FILTERSORT = "FilterSort"


@pytest.fixture
def roster_table_obj(engine_with_roster):
    engine, schema = engine_with_roster
    metadata = MetaData(bind=engine)
    roster = Table(ROSTER, metadata, schema=schema, autoload_with=engine)
    return roster, engine


@pytest.fixture
def filter_sort_table_obj(engine_with_filter_sort):
    engine, schema = engine_with_filter_sort
    metadata = MetaData(bind=engine)
    roster = Table(FILTERSORT, metadata, schema=schema, autoload_with=engine)
    return roster, engine


def test_get_records_gets_ordered_records_str_col_name(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": "Teacher", "direction": "asc"}]
    record_list = records.get_records(roster, engine, order_by=order_list)
    assert record_list[0][4] == "Amber Hudson"


def test_get_records_gets_ordered_records_num_col(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": "Grade", "direction": "asc"}]
    record_list = records.get_records(roster, engine, order_by=order_list)
    assert record_list[0][7] == 25


def test_get_records_gets_ordered_records_str_col_obj(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": roster.columns["Teacher"], "direction": "asc"}]
    record_list = records.get_records(roster, engine, order_by=order_list)
    assert record_list[0][4] == "Amber Hudson"


def test_get_records_gets_ordered_records_num_col_obj(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": roster.columns["Grade"], "direction": "asc"}]
    record_list = records.get_records(roster, engine, order_by=order_list)
    assert record_list[0][7] == 25


def test_get_records_ordered_col_set(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [
        {"field": "Student Name", "direction": "asc"},
        {"field": "Grade", "direction": "asc"}
    ]
    record_list = records.get_records(roster, engine, order_by=order_list)
    assert record_list[0][2] == "Alejandro Lam" and record_list[0][7] == 40


def test_get_records_ordered_col_set_different_col_order(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [
        {"field": "Grade", "direction": "asc"},
        {"field": "Student Name", "direction": "asc"}
    ]
    record_list = records.get_records(roster, engine, order_by=order_list)
    assert record_list[0][7] == 25 and record_list[0][2] == "Amy Gamble"


def test_get_records_orders_before_limiting(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [
        {"field": "Grade", "direction": "asc"},
        {"field": "Student Name", "direction": "asc"}
    ]
    record_list = records.get_records(roster, engine, limit=1, order_by=order_list)
    assert record_list[0][7] == 25 and record_list[0][2] == "Amy Gamble"


dir_to_python_func = {
    "asc": lambda x, y: x <= y,
    "desc": lambda x, y: x >= y,
}


single_field_test_list = [
    (field, direction)
    for field in ["varchar", "numeric", "date"]
    for direction in ["asc", "desc"]
]


@pytest.mark.parametrize("field,direction", single_field_test_list)
def test_get_records_orders_single_field(
    filter_sort_table_obj, field, direction
):
    filter_sort, engine = filter_sort_table_obj
    order_list = [{"field": field, "direction": direction}]

    record_list = records.get_records(filter_sort, engine, order_by=order_list)

    for i in range(1, len(record_list)):
        prev = getattr(record_list[i - 1], field)
        curr = getattr(record_list[i], field)
        if prev is None or curr is None:
            continue
        comp_func = dir_to_python_func[direction]
        assert comp_func(prev, curr)


multi_field_test_list = [
    list(zip(fields, directions))
    for fields in [
        ("Student Email", "Grade"),
        ("Grade", "Student Email")
    ]
    for directions in [
        ["asc", "asc"],
        ["asc", "desc"],
        ["desc", "asc"],
        ["desc", "desc"],
    ]
]


@pytest.mark.parametrize("field_dir_pairs", multi_field_test_list)
def test_get_records_orders_multiple_fields(
    roster_table_obj, field_dir_pairs
):
    roster_sort, engine = roster_table_obj
    order_list = [
        {"field": field, "direction": direction}
        for field, direction in field_dir_pairs
    ]

    record_list = records.get_records(roster_sort, engine, order_by=order_list)

    for i in range(1, len(record_list)):
        prev_field_equal = True
        for field, direction in field_dir_pairs:
            prev = getattr(record_list[i - 1], field)
            curr = getattr(record_list[i], field)
            if prev is None or curr is None:
                continue
            comp_func = dir_to_python_func[direction]

            # Only check order when previous field has equal values
            assert not prev_field_equal or comp_func(prev, curr)
            prev_field_equal = prev == curr


exceptions_test_list = [
    (("field", "tuple", "direction", "asc"), BadSortFormat),
    ([{"field": "varchar", "direction": "sideways"}], BadSortFormat),
    ([{"direction": "asc"}], BadSortFormat),
    ([{"field": "varchar"}], BadSortFormat),
    ([{"field": "non_existent", "direction": "asc"}], SortFieldNotFound),
]


@pytest.mark.parametrize("order_list,exception", exceptions_test_list)
def test_get_records_orders_exceptions(filter_sort_table_obj, order_list, exception):
    filter_sort, engine = filter_sort_table_obj
    with pytest.raises(exception):
        records.get_records(filter_sort, engine, order_by=order_list)
