from unittest.mock import patch

from psycopg2.errors import NotNullViolation
import pytest
from sqlalchemy import String, Integer, Column, select, Table, MetaData, VARCHAR
from sqlalchemy.exc import IntegrityError

from db import constants
from db.columns.operations import alter as alter_operations
from db.columns.operations.alter import alter_column, batch_update_columns, change_column_nullable, rename_column, retype_column, set_column_default
from db.columns.operations.select import get_column_attnum_from_name, get_column_default, get_column_index_from_name
from db.columns.utils import get_mathesar_column_with_engine
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import get_oid_from_table, reflect_table
from db.tables.operations.split import extract_columns_from_table
from db.tests.columns.utils import create_test_table, column_test_dict, get_default
from db.tests.types import fixtures
from db.types.base import get_db_type_name


engine_with_types = fixtures.engine_with_types
temporary_testing_schema = fixtures.temporary_testing_schema
engine_email_type = fixtures.engine_email_type


nullable_changes = [(True, True), (False, False), (True, False), (False, True)]


def _rename_column_and_assert(table, old_col_name, new_col_name, engine):
    """
    Renames the colum of a table and assert the change went through
    """
    table_oid = get_oid_from_table(table.name, table.schema, engine)
    column_index = get_column_index_from_name(table_oid, old_col_name, engine)
    with engine.begin() as conn:
        rename_column(table, column_index, engine, conn, new_col_name)
    table = reflect_table(table.name, table.schema, engine)
    assert new_col_name in table.columns
    assert old_col_name not in table.columns
    return table


def _create_pizza_table(engine, schema):
    table_name = 'Pizzas'
    cols = [
        Column('ID', String),
        Column('Pizza', String),
        Column('Checkbox', String),
        Column('Rating', String)
    ]
    insert_data = [
        ('1', 'Pepperoni', 'true', '4.0'),
        ('2', 'Supreme', 'false', '5.0'),
        ('3', 'Hawaiian', 'true', '3.5')
    ]
    return create_test_table(table_name, cols, insert_data, schema, engine)


def _get_pizza_column_data():
    return [{
        'name': 'ID',
        'plain_type': 'VARCHAR'
    }, {
        'name': 'Pizza',
        'plain_type': 'VARCHAR'
    }, {
        'name': 'Checkbox',
        'plain_type': 'VARCHAR'
    }, {
        'name': 'Rating',
        'plain_type': 'VARCHAR'
    }]


@pytest.mark.parametrize(
    "column_dict,func_name",
    [
        ({"name": "blah"}, "rename_column"),
        ({"plain_type": "blah"}, "retype_column"),
        ({"type_options": {"blah": "blah"}}, "retype_column"),
        ({"nullable": True}, "change_column_nullable"),
        ({"column_default_dict": {"value": 1}}, "set_column_default"),
    ]
)
def test_alter_column_chooses_wisely(column_dict, func_name, engine_with_schema):
    table_name = "table_with_columns"
    engine, schema = engine_with_schema
    metadata = MetaData(bind=engine, schema=schema)
    table = Table(table_name, metadata, Column('col', String))
    table.create()
    table_oid = get_oid_from_table(table.name, table.schema, engine)

    with patch.object(alter_operations, func_name) as mock_alterer:
        alter_column(
            engine,
            table_oid,
            0,
            column_dict
        )
        mock_alterer.assert_called_once()


def test_rename_column_and_assert(engine_with_schema):
    old_col_name = "col1"
    new_col_name = "col2"
    table_name = "table_with_columns"
    engine, schema = engine_with_schema
    metadata = MetaData(bind=engine, schema=schema)
    table = Table(table_name, metadata, Column(old_col_name, String))
    table.create()
    _rename_column_and_assert(table, old_col_name, new_col_name, engine)


def test_rename_column_foreign_keys(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_to_split"
    columns_list = [Column("Filler 1", Integer), Column("Filler 2", Integer)]
    create_mathesar_table(table_name, schema, columns_list, engine)
    extracted, remainder, fk_name = extract_columns_from_table(
        table_name, ["Filler 1"], "Extracted", "Remainder", schema, engine
    )
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
    table = Table(table_name, metadata, Column(old_col_name, Integer, index=True))
    table.create()

    table = _rename_column_and_assert(table, old_col_name, new_col_name, engine)

    with engine.begin() as conn:
        index = engine.dialect.get_indexes(conn, table_name, schema)[0]
        index_columns = index["column_names"]
    assert old_col_name not in index_columns
    assert new_col_name in index_columns


def test_retype_column_correct_column(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = "boolean"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer),
        Column(nontarget_column_name, String),
    )
    table.create()
    with engine.begin() as conn:
        with patch.object(alter_operations, "alter_column_type") as mock_retyper:
            retype_column(table, 0, engine, conn, target_type)
        mock_retyper.assert_called_with(
            table,
            target_column_name,
            engine,
            conn,
            "boolean",
            {},
            friendly_names=False
        )


@pytest.mark.parametrize('target_type', ['numeric', 'decimal'])
def test_retype_column_adds_options(engine_with_schema, target_type):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer),
        Column(nontarget_column_name, String),
    )
    table.create()
    type_options = {"precision": 5}
    with engine.begin() as conn:
        with patch.object(alter_operations, "alter_column_type") as mock_retyper:
            retype_column(table, 0, engine, conn, target_type, type_options)
        mock_retyper.assert_called_with(
            table,
            target_column_name,
            engine,
            conn,
            target_type,
            type_options,
            friendly_names=False
        )


def test_retype_column_options_only(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_column_name = "thecolumntochange"
    target_type = "VARCHAR"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, VARCHAR),
    )
    table.create()
    type_options = {"length": 5}
    with engine.begin() as conn:
        with patch.object(alter_operations, "alter_column_type") as mock_retyper:
            retype_column(
                table, 0, engine, conn, new_type=None, type_options=type_options
            )
        mock_retyper.assert_called_with(
            table,
            target_column_name,
            engine,
            conn,
            target_type,
            type_options,
            friendly_names=False
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
        Column(target_column_name, Integer, nullable=nullable_tup[0]),
        Column(nontarget_column_name, String),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    with engine.begin() as conn:
        change_column_nullable(
            table_oid,
            target_column_attnum,
            engine,
            conn,
            nullable_tup[1],
        )
    changed_table = reflect_table(table_name, schema, engine)
    changed_column = get_mathesar_column_with_engine(
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
        Column(target_column_name, Integer, nullable=nullable_tup[0]),
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
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
    with engine.begin() as conn:
        change_column_nullable(
            table_oid,
            target_column_attnum,
            engine,
            conn,
            nullable_tup[1],
        )
    changed_table = reflect_table(table_name, schema, engine)
    changed_column = get_mathesar_column_with_engine(
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
        Column(target_column_name, Integer, nullable=True),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    target_column_attnum = get_column_attnum_from_name(table_oid, target_column_name, engine)
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
def test_column_default_create(engine_email_type, col_type):
    engine, schema = engine_email_type
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
    column_attnum = get_column_attnum_from_name(table_oid, column_name, engine)
    with engine.begin() as conn:
        set_column_default(table_oid, column_attnum, engine, conn, set_default)

    default = get_column_default(table_oid, column_attnum, engine)
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
    column_attnum = get_column_attnum_from_name(table_oid, column_name, engine)
    with engine.begin() as conn:
        set_column_default(table_oid, column_attnum, engine, conn, set_default)
    default = get_column_default(table_oid, column_attnum, engine)
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
    column_attnum = get_column_attnum_from_name(table_oid, column_name, engine)
    with engine.begin() as conn:
        set_column_default(table_oid, column_attnum, engine, conn, None)
    default = get_column_default(table_oid, column_attnum, engine)
    created_default = get_default(engine, table)

    assert default is None
    assert created_default is None


def test_batch_update_columns_no_changes(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    batch_update_columns(table_oid, engine, _get_pizza_column_data())
    updated_table = reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine)
        assert new_column_type == 'VARCHAR'
        assert updated_table.columns[index].name == table.columns[index].name


def test_batch_update_column_names(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[1]['name'] = 'Pizza Style'
    column_data[2]['name'] = 'Eaten Recently?'

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_types(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0]['plain_type'] = 'DOUBLE PRECISION'
    column_data[2]['plain_type'] = 'BOOLEAN'

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_names_and_types(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0]['name'] = 'Pizza ID'
    column_data[0]['plain_type'] = 'INTEGER'
    column_data[1]['name'] = 'Pizza Style'
    column_data[2]['plain_type'] = 'BOOLEAN'

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_drop_columns(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0] = {}
    column_data[1] = {}

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine)

    assert len(updated_table.columns) == len(table.columns) - 2
    for index, column in enumerate(updated_table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine)
        assert new_column_type == column_data[index - 2]['plain_type']
        assert updated_table.columns[index].name == column_data[index - 2]['name']


def test_batch_update_column_all_operations(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0]['name'] = 'Pizza ID'
    column_data[0]['plain_type'] = 'INTEGER'
    column_data[1]['name'] = 'Pizza Style'
    column_data[2]['plain_type'] = 'BOOLEAN'
    column_data[3] = {}

    batch_update_columns(table_oid, engine, column_data)
    updated_table = reflect_table(table.name, schema, engine)

    assert len(updated_table.columns) == len(table.columns) - 1
    for index, column in enumerate(updated_table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']
