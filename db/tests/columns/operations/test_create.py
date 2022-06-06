import pytest
from sqlalchemy import INTEGER, Column, Table, MetaData, NUMERIC, UniqueConstraint

from db.columns.operations.create import create_column, duplicate_column, gen_col_name
from db.columns.operations.select import get_column_attnum_from_name, get_column_default
from db.tables.operations.select import get_oid_from_table, reflect_table_from_oid
from db.constraints.operations.select import get_column_constraints
from db.tests.columns.utils import create_test_table
from db.types.base import get_available_known_db_types, known_db_types, get_db_type_enum_from_class, PostgresType
from db.constants import COLUMN_NAME_TEMPLATE


duplicate_column_options = [
    (True, True),
    (True, False),
    (False, True),
    (False, False),
]


def _check_duplicate_data(table_oid, engine, copy_data):
    table = reflect_table_from_oid(table_oid, engine)

    with engine.begin() as conn:
        rows = conn.execute(table.select()).fetchall()
    if copy_data:
        assert all([row[0] == row[-1] for row in rows])
    else:
        assert all([row[-1] is None for row in rows])


def _check_duplicate_unique_constraint(
    table_oid, col_attnum, con_attnums, engine, copy_constraints
):
    constraints_ = get_column_constraints(col_attnum, table_oid, engine)
    if copy_constraints:
        assert len(constraints_) == 1
        constraint = constraints_[0]
        assert constraint.contype == "u"
        assert set(constraint.conkey) == set(con_attnums)
    else:
        assert len(constraints_) == 0


def test_type_list_completeness(engine):
    """
    Ensure that unavailable types are unavailable for a good reason.
    """
    actual_supported_db_types = get_available_known_db_types(engine)
    unavailable_types = set.difference(set(known_db_types), set(actual_supported_db_types))
    for db_type in unavailable_types:
        assert (
            db_type.is_inconsistent
            or db_type.is_optional
            or db_type.is_sa_only
        )


@pytest.mark.parametrize("target_type", sorted(known_db_types))
def test_create_column(engine_with_schema, target_type):
    """
    One of the things this test checks is for every type in known_db_types, once that type is
    applied to a column, and the column is reflected, that the reflected type is the same one that
    was applied.
    """
    if target_type.is_application_supported and target_type.is_reflection_supported and not target_type.is_optional:
        engine, schema = engine_with_schema
        table_name = "atableone"
        initial_column_name = "original_column"
        new_column_name = "added_column"
        table = Table(
            table_name,
            MetaData(bind=engine, schema=schema),
            Column(initial_column_name, INTEGER),
        )
        table.create()
        table_oid = get_oid_from_table(table_name, schema, engine)
        target_type_id = target_type.id
        column_data = {"name": new_column_name, "type": target_type_id}
        created_col = create_column(engine, table_oid, column_data)
        altered_table = reflect_table_from_oid(table_oid, engine)
        assert len(altered_table.columns) == 2
        assert created_col.name == new_column_name
        reflected_type = get_db_type_enum_from_class(created_col.type.__class__, engine)
        assert reflected_type == target_type


@pytest.mark.parametrize("target_type", [PostgresType.NUMERIC])
def test_create_column_options(engine_with_schema, target_type):
    engine, schema = engine_with_schema
    table_name = "atableone"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, INTEGER),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": target_type.id,
        "type_options": {"precision": 5, "scale": 3},
    }
    created_col = create_column(engine, table_oid, column_data)
    altered_table = reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == new_column_name
    assert created_col.db_type == PostgresType.NUMERIC
    assert created_col.type_options == {"precision": 5, "scale": 3}


@pytest.mark.parametrize("target_type", [PostgresType.CHARACTER, PostgresType.CHARACTER_VARYING])
def test_create_column_length_options(engine_with_schema, target_type):
    engine, schema = engine_with_schema
    table_name = "atableone"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, INTEGER),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": target_type.id,
        "type_options": {"length": 5},
    }
    created_col = create_column(engine, table_oid, column_data)
    altered_table = reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == new_column_name
    assert created_col.db_type == target_type
    assert created_col.type_options == {"length": 5}


@pytest.mark.parametrize(
    "type_options",
    [{"fields": "year"}, {"precision": 3}, {"precision": 3, "fields": "second"}]
)
def test_create_column_interval_options(engine_with_schema, type_options):
    engine, schema = engine_with_schema
    table_name = "atableone"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, INTEGER),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": PostgresType.INTERVAL.id,
        "type_options": type_options,
    }
    created_col = create_column(engine, table_oid, column_data)
    altered_table = reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == new_column_name
    assert created_col.db_type == PostgresType.INTERVAL
    assert created_col.type_options == type_options


def test_create_column_bad_options(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = PostgresType.BOOLEAN
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, INTEGER),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": target_type.id,
        "type_options": {"precision": 5, "scale": 3},
    }
    with pytest.raises(TypeError):
        create_column(engine, table_oid, column_data)


def test_duplicate_column_name(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atable"
    filler_column_name = "Filler"
    new_col_name = "duplicated_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(filler_column_name, NUMERIC)
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    col_attnum = get_column_attnum_from_name(table_oid, filler_column_name, engine)
    duplicate_column(table_oid, col_attnum, engine, new_col_name)
    table = reflect_table_from_oid(table_oid, engine)
    assert new_col_name in table.c


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
def test_duplicate_column_single_unique(engine_with_schema, copy_data, copy_constraints):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    cols = [Column(target_column_name, NUMERIC, unique=True)]
    insert_data = [(1,), (2,), (3,)]
    create_test_table(table_name, cols, insert_data, schema, engine)

    table_oid = get_oid_from_table(table_name, schema, engine)
    target_col_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    duplicate_column(
        table_oid, target_col_attnum, engine, new_col_name, copy_data, copy_constraints
    )

    col_attnum = get_column_attnum_from_name(table_oid, new_col_name, engine)
    _check_duplicate_data(table_oid, engine, copy_data)
    _check_duplicate_unique_constraint(
        table_oid, col_attnum, [col_attnum], engine, copy_constraints
    )


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
def test_duplicate_column_multi_unique(engine_with_schema, copy_data, copy_constraints):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    filler_col_name = "Filler"
    cols = [
        Column(target_column_name, NUMERIC),
        Column(filler_col_name, NUMERIC),
        UniqueConstraint(target_column_name, filler_col_name)
    ]
    insert_data = [(1, 2), (2, 3), (3, 4)]
    create_test_table(table_name, cols, insert_data, schema, engine)

    table_oid = get_oid_from_table(table_name, schema, engine)
    target_col_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    duplicate_column(
        table_oid, target_col_attnum, engine, new_col_name, copy_data, copy_constraints
    )

    new_col_attnum = get_column_attnum_from_name(table_oid, new_col_name, engine)
    filler_col_attnum = get_column_attnum_from_name(table_oid, filler_col_name, engine)
    _check_duplicate_data(table_oid, engine, copy_data)
    _check_duplicate_unique_constraint(
        table_oid, new_col_attnum, [filler_col_attnum, new_col_attnum], engine, copy_constraints
    )


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
@pytest.mark.parametrize('nullable', [True, False])
def test_duplicate_column_nullable(
    engine_with_schema, nullable, copy_data, copy_constraints
):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    cols = [Column(target_column_name, NUMERIC, nullable=nullable)]
    insert_data = [(1,), (2,), (3,)]
    create_test_table(table_name, cols, insert_data, schema, engine)

    table_oid = get_oid_from_table(table_name, schema, engine)
    target_col_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    col = duplicate_column(
        table_oid, target_col_attnum, engine, new_col_name, copy_data, copy_constraints
    )

    _check_duplicate_data(table_oid, engine, copy_data)
    # Nullability constriant is only copied when data is
    # Otherwise, it defaults to True
    if copy_constraints and copy_data:
        assert col.nullable == nullable
    else:
        assert col.nullable is True


def test_duplicate_non_unique_constraint(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    insert_data = [(1,), (2,), (3,)]
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, NUMERIC, primary_key=True),
    )
    table.create()
    with engine.begin() as conn:
        for data in insert_data:
            conn.execute(table.insert().values(data))

    table_oid = get_oid_from_table(table_name, schema, engine)
    col_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    col = duplicate_column(table_oid, col_attnum, engine, new_col_name)

    _check_duplicate_data(table_oid, engine, True)
    assert col.primary_key is False


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
def test_duplicate_column_default(engine_with_schema, copy_data, copy_constraints):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    expt_default = 1
    cols = [Column(target_column_name, NUMERIC, server_default=str(expt_default))]
    create_test_table(table_name, cols, [], schema, engine)

    table_oid = get_oid_from_table(table_name, schema, engine)
    target_col_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    duplicate_column(
        table_oid, target_col_attnum, engine, new_col_name, copy_data, copy_constraints
    )

    column_attnum = get_column_attnum_from_name(table_oid, new_col_name, engine)
    default = get_column_default(table_oid, column_attnum, engine)
    if copy_data:
        assert default == expt_default
    else:
        assert default is None


def test_create_column_accepts_column_data_without_name_attribute(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    initial_column_name = f"{COLUMN_NAME_TEMPLATE}0"
    expected_column_name = f"{COLUMN_NAME_TEMPLATE}1"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, INTEGER),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_data = {"type": "BOOLEAN"}
    created_col = create_column(engine, table_oid, column_data)
    altered_table = reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == expected_column_name


def test_create_column_accepts_column_data_with_name_as_empty_string(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    initial_column_name = f"{COLUMN_NAME_TEMPLATE}0"
    expected_column_name = f"{COLUMN_NAME_TEMPLATE}1"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, INTEGER),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_data = {"name": "", "type": "BOOLEAN"}
    created_col = create_column(engine, table_oid, column_data)
    altered_table = reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == expected_column_name


def test_generate_column_name(engine_with_schema):
    engine, schema = engine_with_schema
    name_set = {
        'Center',
        'Status',
        'Case Number',
        'Patent Number',
        'Application SN',
        'Title',
        'Patent Expiration Date',
        ''
    }
    table_name = "atableone"
    initial_column_name = "id"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, INTEGER),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    for name in name_set:
        column_data = {"name": name, "type": "BOOLEAN"}
        create_column(engine, table_oid, column_data)
    altered_table = reflect_table_from_oid(table_oid, engine)
    n = len(name_set) + 1
    # Expected column name should be 'Column n'
    # where n is length of number of columns already in the table
    expected_column_name = f"{COLUMN_NAME_TEMPLATE}{n}"
    generated_column_name = gen_col_name(altered_table)
    assert len(altered_table.columns) == n
    assert generated_column_name == expected_column_name
