from unittest.mock import patch

from psycopg2.errors import NotNullViolation
import pytest
from sqlalchemy import Column, select, Table, MetaData, VARCHAR, INTEGER
from sqlalchemy.exc import IntegrityError

from db import constants
from db.columns.operations import alter as alter_operations
from db.columns.operations.alter import alter_column, batch_update_columns, change_column_nullable, rename_column, retype_column, set_column_default
from db.columns.operations.select import (
    get_column_attnum_from_name, get_column_default, get_column_name_from_attnum,
    get_columns_attnum_from_names,
)
from db.columns.utils import to_mathesar_column_with_engine
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import get_oid_from_table, reflect_table
from db.tables.operations.split import extract_columns_from_table
from db.tests.columns.utils import column_test_dict, create_test_table, get_default
from db.types.base import PostgresType
from db.types.operations.convert import get_db_type_enum_from_class
from db.metadata import get_empty_metadata


nullable_changes = [(True, True), (False, False), (True, False), (False, True)]


def _rename_column_and_assert(table, old_col_name, new_col_name, engine):
    """
    Renames the colum of a table and assert the change went through
    """
    table_oid = get_oid_from_table(table.name, table.schema, engine)
    column_attnum = get_column_attnum_from_name(table_oid, old_col_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        rename_column(table_oid, column_attnum, engine, conn, new_col_name)
    table = reflect_table(table.name, table.schema, engine, metadata=get_empty_metadata())
    assert new_col_name in table.columns
    assert old_col_name not in table.columns
    return table


def _create_pizza_table(engine, schema):
    table_name = 'Pizzas'
    cols = [
        Column('ID', VARCHAR),
        Column('Pizza', VARCHAR),
        Column('Checkbox', VARCHAR),
        Column('Rating', VARCHAR)
    ]
    insert_data = [
        ('1', 'Pepperoni', 'true', '4.0'),
        ('2', 'Supreme', 'false', '5.0'),
        ('3', 'Hawaiian', 'true', '3.5')
    ]
    return create_test_table(table_name, cols, insert_data, schema, engine)


def _get_pizza_column_data(table_oid, engine):
    column_data = [{
        'name': 'ID',
        'type': PostgresType.CHARACTER_VARYING.id
    }, {
        'name': 'Pizza',
        'type': PostgresType.CHARACTER_VARYING.id
    }, {
        'name': 'Checkbox',
        'type': PostgresType.CHARACTER_VARYING.id
    }, {
        'name': 'Rating',
        'type': PostgresType.CHARACTER_VARYING.id
    }]
    for data in column_data:
        name = data['name']
        data['attnum'] = get_column_attnum_from_name(table_oid, name, engine, metadata=get_empty_metadata())
    return column_data


@pytest.mark.parametrize(
    "column_dict,func_name",
    [
        ({"name": "blah"}, "rename_column"),
        ({"type": "blah"}, "retype_column"),
        ({"type_options": {"blah": "blah"}}, "retype_column"),
        ({"nullable": True}, "change_column_nullable"),
        ({"column_default_dict": {"value": 1}}, "set_column_default"),
    ]
)
def test_alter_column_chooses_wisely(column_dict, func_name, engine_with_schema):
    table_name = "table_with_columns"
    engine, schema = engine_with_schema
    metadata = MetaData(bind=engine, schema=schema)
    column_name = 'col'
    table = Table(table_name, metadata, Column(column_name, VARCHAR))
    table.create()
    table_oid = get_oid_from_table(table.name, table.schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, column_name, engine, metadata=get_empty_metadata())
    with patch.object(alter_operations, func_name) as mock_alterer:
        alter_column(
            engine,
            table_oid,
            target_column_attnum,
            column_dict
        )
        mock_alterer.assert_called_once()


def test_rename_column_and_assert(engine_with_schema):
    old_col_name = "col1"
    new_col_name = "col2"
    table_name = "table_with_columns"
    engine, schema = engine_with_schema
    metadata = MetaData(bind=engine, schema=schema)
    table = Table(table_name, metadata, Column(old_col_name, VARCHAR))
    table.create()
    _rename_column_and_assert(table, old_col_name, new_col_name, engine)


def test_rename_column_foreign_keys(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_to_split"
    columns_list = [Column("Filler 1", INTEGER), Column("Filler 2", INTEGER)]
    create_mathesar_table(table_name, schema, columns_list, engine)
    table_oid = get_oid_from_table(table_name, schema, engine)
    extracted_cols = ["Filler 1"]
    extracted_col_attnums = get_columns_attnum_from_names(table_oid, extracted_cols, engine, metadata=get_empty_metadata())
    extracted, remainder, fk_attnum = extract_columns_from_table(
        table_oid, extracted_col_attnums, "Extracted", schema, engine
    )
    remainder_table_oid = get_oid_from_table(remainder.name, schema, engine)

    fk_name = get_column_name_from_attnum(remainder_table_oid, fk_attnum, engine, get_empty_metadata())
    new_fk_name = "new_" + fk_name
    remainder = _rename_column_and_assert(remainder, fk_name, new_fk_name, engine)

    fk = list(remainder.foreign_keys)[0]
    assert fk.parent.name == new_fk_name
    assert fk.column.table.name == extracted.name


def test_rename_column_sequence(engine_with_schema):
    old_col_name = constants.ID
    new_col_name = "new_" + constants.ID
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    table = create_mathesar_table(table_name, schema, [], engine)
    with engine.begin() as conn:
        ins = table.insert()
        conn.execute(ins)

    table = _rename_column_and_assert(table, old_col_name, new_col_name, engine)

    with engine.begin() as conn:
        ins = table.insert()
        conn.execute(ins)
        slct = select(table)
        result = conn.execute(slct)
    new_value = result.fetchall()[-1][new_col_name]
    assert new_value == 2


def test_rename_column_index(engine_with_schema):
    old_col_name = constants.ID
    new_col_name = "new_" + constants.ID
    engine, schema = engine_with_schema
    table_name = "table_with_index"
    metadata = MetaData(bind=engine, schema=schema)
    table = Table(table_name, metadata, Column(old_col_name, INTEGER, index=True))
    table.create()

    _rename_column_and_assert(table, old_col_name, new_col_name, engine)

    with engine.begin() as conn:
        index = engine.dialect.get_indexes(conn, table_name, schema)[0]
        index_columns = index["column_names"]
    assert old_col_name not in index_columns
    assert new_col_name in index_columns


def test_retype_column_correct_column(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = PostgresType.BOOLEAN
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, INTEGER),
        Column(nontarget_column_name, VARCHAR),
    )
    table.create()
    table_oid = get_oid_from_table(table.name, table.schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        with patch.object(alter_operations, "alter_column_type") as mock_retyper:
            retype_column(table_oid, target_column_attnum, engine, conn, target_type)
        mock_retyper.assert_called_with(
            table_oid,
            target_column_name,
            engine,
            conn,
            PostgresType.BOOLEAN,
            {},
        )


@pytest.mark.parametrize('target_type', [PostgresType.NUMERIC])
def test_retype_column_adds_options(engine_with_schema, target_type):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, INTEGER),
        Column(nontarget_column_name, VARCHAR),
    )
    table.create()
    type_options = {"precision": 5}
    table_oid = get_oid_from_table(table.name, table.schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine, metadata=get_empty_metadata())

    with engine.begin() as conn:
        with patch.object(alter_operations, "alter_column_type") as mock_retyper:
            retype_column(table_oid, target_column_attnum, engine, conn, target_type, type_options)
        mock_retyper.assert_called_with(
            table_oid,
            target_column_name,
            engine,
            conn,
            target_type,
            type_options,
        )


def test_retype_column_options_only(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_column_name = "thecolumntochange"
    target_type = PostgresType.CHARACTER_VARYING
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, VARCHAR),
    )
    table.create()
    type_options = {"length": 5}
    table_oid = get_oid_from_table(table.name, table.schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        with patch.object(alter_operations, "alter_column_type") as mock_retyper:
            retype_column(
                table_oid, target_column_attnum, engine, conn, new_type=None, type_options=type_options
            )
        mock_retyper.assert_called_with(
            table_oid,
            target_column_name,
            engine,
            conn,
            target_type,
            type_options,
        )


@pytest.mark.parametrize("nullable_tup", nullable_changes)
def test_change_column_nullable_changes(engine_with_schema, nullable_tup):
    engine, schema = engine_with_schema
    table_name = "atablefornulling"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, INTEGER, nullable=nullable_tup[0]),
        Column(nontarget_column_name, VARCHAR),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        change_column_nullable(
            table_oid,
            target_column_attnum,
            engine,
            conn,
            nullable_tup[1],
        )
    changed_table = reflect_table(table_name, schema, engine, metadata=get_empty_metadata())
    changed_column = to_mathesar_column_with_engine(
        changed_table.columns[0],
        engine
    )
    assert changed_column.nullable is nullable_tup[1]


@pytest.mark.parametrize("nullable_tup", nullable_changes)
def test_change_column_nullable_with_data(engine_with_schema, nullable_tup):
    engine, schema = engine_with_schema
    table_name = "atablefornulling"
    target_column_name = "thecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, INTEGER, nullable=nullable_tup[0]),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    ins = table.insert().values(
        [
            {target_column_name: 1},
            {target_column_name: 2},
            {target_column_name: 3},
        ]
    )
    with engine.begin() as conn:
        conn.execute(ins)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        change_column_nullable(
            table_oid,
            target_column_attnum,
            engine,
            conn,
            nullable_tup[1],
        )
    changed_table = reflect_table(table_name, schema, engine, metadata=get_empty_metadata())
    changed_column = to_mathesar_column_with_engine(
        changed_table.columns[0],
        engine
    )
    assert changed_column.nullable is nullable_tup[1]


def test_change_column_nullable_changes_raises_with_null_data(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atablefornulling"
    target_column_name = "thecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, INTEGER, nullable=True),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine, metadata=get_empty_metadata())
    ins = table.insert().values(
        [
            {target_column_name: 1},
            {target_column_name: 2},
            {target_column_name: None},
        ]
    )
    with engine.begin() as conn:
        conn.execute(ins)
    with engine.begin() as conn:
        with pytest.raises(IntegrityError) as e:
            change_column_nullable(
                table_oid,
                target_column_attnum,
                engine,
                conn,
                False,
            )
            assert type(e.orig) == NotNullViolation


@pytest.mark.parametrize("col_type", column_test_dict.keys())
def test_column_default_create(engine_with_schema, col_type):
    engine, schema = engine_with_schema
    table_name = "create_column_default_table"
    column_name = "create_column_default_column"
    _, set_default, expt_default = column_test_dict[col_type].values()
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(column_name, col_type)
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_attnum = get_column_attnum_from_name(table_oid, column_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        set_column_default(table_oid, column_attnum, engine, conn, set_default)

    default = get_column_default(table_oid, column_attnum, engine, metadata=get_empty_metadata())
    created_default = get_default(engine, table)

    assert default == expt_default
    assert created_default == expt_default


@pytest.mark.parametrize("col_type", column_test_dict.keys())
def test_column_default_update(engine_with_schema, col_type):
    engine, schema = engine_with_schema
    table_name = "update_column_default_table"
    column_name = "update_column_default_column"
    start_default, set_default, expt_default = column_test_dict[col_type].values()
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(column_name, col_type, server_default=start_default)
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_attnum = get_column_attnum_from_name(table_oid, column_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        set_column_default(table_oid, column_attnum, engine, conn, set_default)
    default = get_column_default(table_oid, column_attnum, engine, metadata=get_empty_metadata())
    created_default = get_default(engine, table)

    assert default != start_default
    assert default == expt_default
    assert created_default == expt_default


@pytest.mark.parametrize("col_type", column_test_dict.keys())
def test_column_default_delete(engine_with_schema, col_type):
    engine, schema = engine_with_schema
    table_name = "delete_column_default_table"
    column_name = "delete_column_default_column"
    _, set_default, _ = column_test_dict[col_type].values()
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(column_name, col_type, server_default=set_default)
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    column_attnum = get_column_attnum_from_name(table_oid, column_name, engine, metadata=get_empty_metadata())
    with engine.begin() as conn:
        set_column_default(table_oid, column_attnum, engine, conn, None)
    default = get_column_default(table_oid, column_attnum, engine, metadata=get_empty_metadata())
    created_default = get_default(engine, table)

    assert default is None
    assert created_default is None


def test_batch_update_columns_no_changes(engine_with_schema):
    engine, schema = engine_with_schema
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data(table_oid, engine)
    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine, metadata=get_empty_metadata())

    assert len(table.columns) == len(updated_table.columns)
    for index, _ in enumerate(table.columns):
        new_column_type_class = updated_table.columns[index].type.__class__
        new_column_type = get_db_type_enum_from_class(new_column_type_class).id
        assert new_column_type == PostgresType.CHARACTER_VARYING.id
        assert updated_table.columns[index].name == table.columns[index].name


def test_batch_update_column_names(engine_with_schema):
    engine, schema = engine_with_schema
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data(table_oid, engine)
    column_data[1]['name'] = 'Pizza Style'
    column_data[2]['name'] = 'Eaten Recently?'

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine, metadata=get_empty_metadata())

    assert len(table.columns) == len(updated_table.columns)
    for index, _ in enumerate(table.columns):
        new_column_type_class = updated_table.columns[index].type.__class__
        new_column_type = get_db_type_enum_from_class(new_column_type_class).id
        assert new_column_type == column_data[index]['type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_types(engine_with_schema):
    engine, schema = engine_with_schema
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data(table_oid, engine)
    column_data[0]['type'] = PostgresType.DOUBLE_PRECISION.id
    column_data[2]['type'] = PostgresType.BOOLEAN.id

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine, metadata=get_empty_metadata())

    assert len(table.columns) == len(updated_table.columns)
    for index, _ in enumerate(table.columns):
        new_column_type_class = updated_table.columns[index].type.__class__
        new_column_type = get_db_type_enum_from_class(new_column_type_class).id
        assert new_column_type == column_data[index]['type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_names_and_types(engine_with_schema):
    engine, schema = engine_with_schema
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data(table_oid, engine)
    column_data[0]['name'] = 'Pizza ID'
    column_data[0]['type'] = PostgresType.INTEGER.id
    column_data[1]['name'] = 'Pizza Style'
    column_data[2]['type'] = PostgresType.BOOLEAN.id

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine, metadata=get_empty_metadata())

    assert len(table.columns) == len(updated_table.columns)
    for index, _ in enumerate(table.columns):
        new_column_type_class = updated_table.columns[index].type.__class__
        new_column_type = get_db_type_enum_from_class(new_column_type_class).id
        assert new_column_type == column_data[index]['type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_drop_columns(engine_with_schema):
    engine, schema = engine_with_schema
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data(table_oid, engine)
    metadata = get_empty_metadata()
    column_data[0] = {
        'attnum': get_column_attnum_from_name(table_oid, column_data[0]['name'], engine, metadata=metadata),
        'delete': True
    }
    column_data[1] = {
        'attnum': get_column_attnum_from_name(table_oid, column_data[1]['name'], engine, metadata=metadata),
        'delete': True
    }

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine, metadata=get_empty_metadata())

    assert len(updated_table.columns) == len(table.columns) - 2
    for index, _ in enumerate(updated_table.columns):
        new_column_type_class = updated_table.columns[index].type.__class__
        new_column_type = get_db_type_enum_from_class(new_column_type_class).id
        assert new_column_type == column_data[index - 2]['type']
        assert updated_table.columns[index].name == column_data[index - 2]['name']


def test_batch_update_column_all_operations(engine_with_schema):
    engine, schema = engine_with_schema
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data(table_oid, engine)
    column_data[0]['name'] = 'Pizza ID'
    column_data[0]['type'] = PostgresType.INTEGER.id
    column_data[1]['name'] = 'Pizza Style'
    column_data[2]['type'] = PostgresType.BOOLEAN.id
    column_data[3] = {
        'attnum': get_column_attnum_from_name(table_oid, column_data[3]['name'], engine, metadata=get_empty_metadata()),
        'delete': True
    }

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine, metadata=get_empty_metadata())

    assert len(updated_table.columns) == len(table.columns) - 1
    for index, _ in enumerate(updated_table.columns):
        new_column_type_class = updated_table.columns[index].type.__class__
        new_column_type = get_db_type_enum_from_class(new_column_type_class).id
        assert new_column_type == column_data[index]['type']
        assert updated_table.columns[index].name == column_data[index]['name']
