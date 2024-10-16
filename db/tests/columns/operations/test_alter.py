import json
from unittest.mock import patch
from sqlalchemy import Column, select, Table, MetaData, VARCHAR, INTEGER

from db import constants
from db.columns.operations import alter as col_alt
from db.columns.operations.alter import batch_update_columns
from db.columns.operations.select import (
    get_column_attnum_from_name, get_column_name_from_attnum,
    get_columns_attnum_from_names,
)
from db.tables.operations.select import (
    get_oid_from_table, reflect_table, reflect_table_from_oid
)
from db.tables.operations.split import extract_columns_from_table
from db.tests.columns.utils import create_test_table
from db.types.base import PostgresType
from db.types.operations.convert import get_db_type_enum_from_class
from db.metadata import get_empty_metadata
from db.schemas.utils import get_schema_oid_from_name


def test_alter_columns_in_table_basic():
    with patch.object(col_alt.db_conn, 'exec_msar_func') as mock_exec:
        col_alt.alter_columns_in_table(
            123,
            [
                {
                    "id": 3, "name": "colname3", "type": "numeric",
                    "type_options": {"precision": 8}, "nullable": True,
                    "default": {"value": 8, "is_dynamic": False},
                    "description": "third column"
                }, {
                    "id": 6, "name": "colname6", "type": "character varying",
                    "type_options": {"length": 32}, "nullable": True,
                    "default": {"value": "blahblah", "is_dynamic": False},
                    "description": "textual column"
                }
            ],
            'conn'
        )
        expect_json_arg = [
            {
                "attnum": 3, "name": "colname3",
                "type": {"name": "numeric", "options": {"precision": 8}},
                "not_null": False, "default": 8, "description": "third column",
            }, {
                "attnum": 6, "name": "colname6",
                "type": {
                    "name": "character varying", "options": {"length": 32},
                },
                "not_null": False, "default": "blahblah",
                "description": "textual column"
            }
        ]
        assert mock_exec.call_args.args[:3] == ('conn', 'alter_columns', 123)
        # Necessary since `json.dumps` mangles dict ordering, but we don't care.
        assert json.loads(mock_exec.call_args.args[3]) == expect_json_arg


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
