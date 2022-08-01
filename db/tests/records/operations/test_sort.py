import pytest

from sqlalchemy import MetaData, Table
from sqlalchemy.schema import DropConstraint
from sqlalchemy_filters.exceptions import BadSortFormat, SortFieldNotFound

from db.records.operations.select import get_records, get_records_with_default_order


def test_get_records_gets_ordered_records_str_col_name(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": "Teacher", "direction": "asc"}]
    record_list = get_records(roster, engine, order_by=order_list)
    assert record_list[0][4] == "Amber Hudson"


def test_get_records_gets_ordered_records_num_col(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": "Grade", "direction": "asc"}]
    record_list = get_records(roster, engine, order_by=order_list)
    assert record_list[0][7] == 25


def test_json_sort_array(json_table_obj):
    roster, engine = json_table_obj
    order_list = [{"field": "json_array", "direction": "asc"}]
    record_list = get_records(roster, engine, order_by=order_list)
    assert [row["json_array"] for row in record_list] == [
        '[]',
        '["BMW", "Ford", "Fiat"]',
        '["BMW", "Ford", [1, 2]]',
        '["BMW", "Ford", ["Akshay", "Prashant", "Varun"]]',
        '["BMW", "Ford", [1, 2, 3]]',
        '["Ford", "BMW", "Fiat"]',
        '[1, 2, 3]',
        '[1, 2, false]',
        '[1, 2, true]',
        '[2, 3, 4]',
        '[false, false, false]',
        '[true, true, false]',
        '["BMW", "Ford", "Fiat", "Fiat"]',
        '["Ram", "Shyam", "Radhika", "Akshay", "Prashant", "Varun"]'
    ]


def test_get_records_gets_ordered_records_str_col_obj(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": roster.columns["Teacher"], "direction": "asc"}]
    record_list = get_records(roster, engine, order_by=order_list)
    assert record_list[0][4] == "Amber Hudson"


def test_get_records_gets_ordered_records_num_col_obj(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [{"field": roster.columns["Grade"], "direction": "asc"}]
    record_list = get_records(roster, engine, order_by=order_list)
    assert record_list[0][7] == 25


def test_get_records_ordered_col_set(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [
        {"field": "Student Name", "direction": "asc"},
        {"field": "Grade", "direction": "asc"}
    ]
    record_list = get_records(roster, engine, order_by=order_list)
    assert record_list[0][2] == "Alejandro Lam" and record_list[0][7] == 40


def test_get_records_ordered_col_set_different_col_order(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [
        {"field": "Grade", "direction": "asc"},
        {"field": "Student Name", "direction": "asc"}
    ]
    record_list = get_records(roster, engine, order_by=order_list)
    assert record_list[0][7] == 25 and record_list[0][2] == "Amy Gamble"


def test_get_records_orders_before_limiting(roster_table_obj):
    roster, engine = roster_table_obj
    order_list = [
        {"field": "Grade", "direction": "asc"},
        {"field": "Student Name", "direction": "asc"}
    ]
    record_list = get_records(roster, engine, limit=1, order_by=order_list)
    assert record_list[0][7] == 25 and record_list[0][2] == "Amy Gamble"


def check_single_field_ordered(record_list, field, direction):
    for i in range(1, len(record_list)):
        prev = getattr(record_list[i - 1], field)
        curr = getattr(record_list[i], field)
        if prev is None or curr is None:
            continue
        comp_func = dir_to_python_func[direction]
        assert comp_func(prev, curr)


def check_multi_field_ordered(record_list, field_dir_pairs):
    for i in range(1, len(record_list)):
        for field, direction in field_dir_pairs:
            prev = getattr(record_list[i - 1], field)
            curr = getattr(record_list[i], field)
            if prev is None or curr is None:
                continue

            comp_func = dir_to_python_func[direction]
            # If fields are equal, check the next field
            # If fields differ, ensure the comparison is correct
            if prev != curr:
                assert comp_func(prev, curr)
                break


def test_get_records_default_order_single_primary_key(roster_table_obj):
    roster, engine = roster_table_obj
    primary_column = roster.primary_key.columns[0].name
    record_list = get_records_with_default_order(roster, engine)
    check_single_field_ordered(record_list, primary_column, 'asc')


def test_get_records_default_order_composite_primary_key(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj
    primary_columns = [col.name for col in filter_sort.primary_key.columns]
    record_list = get_records(filter_sort, engine)
    field_dir_pairs = [(col, 'asc') for col in primary_columns]
    check_multi_field_ordered(record_list, field_dir_pairs)


def test_get_records_default_order_no_primary_key(filter_sort_table_obj):
    filter_sort, engine = filter_sort_table_obj

    constraint = filter_sort.primary_key
    with engine.begin() as conn:
        conn.execute(DropConstraint(constraint))
    metadata = MetaData(bind=engine)
    filter_sort = Table(
        filter_sort.name, metadata, schema=filter_sort.schema, autoload_with=engine
    )
    assert len(filter_sort.primary_key.columns) == 0

    record_list = get_records(filter_sort, engine)

    columns = [col.name for col in filter_sort.columns]
    field_dir_pairs = [(col, 'asc') for col in columns]
    check_multi_field_ordered(record_list, field_dir_pairs)


dir_to_python_func = {
    "asc": lambda x, y: x <= y,
    "desc": lambda x, y: x >= y,
}


single_field_test_list = [
    (field, direction, null)
    for field in ["varchar", "numeric", "date"]
    for direction in ["asc", "desc"]
    for null in ["nullsfirst", "nullslast"]
]


@pytest.mark.parametrize("field,direction,null", single_field_test_list)
def test_get_records_orders_single_field(
    filter_sort_table_obj, field, direction, null
):
    filter_sort, engine = filter_sort_table_obj
    order_list = [{"field": field, "direction": direction}]
    order_list[0][null] = True

    record_list = get_records(filter_sort, engine, order_by=order_list)

    if null == "nullsfirst":
        assert getattr(record_list[0], field) is None
    elif null == "nullslast":
        assert getattr(record_list[-1], field) is None

    check_single_field_ordered(record_list, field, direction)


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

    record_list = get_records(roster_sort, engine, order_by=order_list)

    check_multi_field_ordered(record_list, field_dir_pairs)


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
        get_records(filter_sort, engine, order_by=order_list)
