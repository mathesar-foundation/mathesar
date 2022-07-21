from django.core.files import File
import pytest
from rest_framework.test import APIClient
from sqlalchemy import Column, INTEGER, VARCHAR, MetaData, BOOLEAN, TIMESTAMP, text
from sqlalchemy import Table as SATable

from db.columns.operations.select import get_column_attnum_from_name
from db.tables.operations.select import get_oid_from_table
from mathesar.models.base import Table, DataFile, Column as ServiceLayerColumn


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def create_data_file():
    def _create_data_file(file_path, file_name):
        with open(file_path, 'rb') as csv_file:
            data_file = DataFile.objects.create(
                file=File(csv_file), created_from='file',
                base_name=file_name
            )

        return data_file
    return _create_data_file


@pytest.fixture
def create_data_types_table(data_types_csv_filepath, create_table):
    csv_filepath = data_types_csv_filepath

    def _create_table(table_name, schema_name='Data Types'):
        return create_table(
            table_name=table_name,
            schema_name=schema_name,
            csv_filepath=csv_filepath,
        )
    return _create_table


@pytest.fixture
def self_referential_table(create_table, get_uid):
    return create_table(
        table_name=get_uid(),
        schema_name=get_uid(),
        csv_filepath='mathesar/tests/data/self_referential_table.csv',
    )


@pytest.fixture
def two_foreign_key_tables(_create_two_tables):
    return _create_two_tables(
        'mathesar/tests/data/base_table.csv',
        'mathesar/tests/data/reference_table.csv',
    )


@pytest.fixture
def two_multi_column_foreign_key_tables(_create_two_tables):
    return _create_two_tables(
        'mathesar/tests/data/multi_column_foreign_key_base_table.csv',
        'mathesar/tests/data/multi_column_reference_table.csv',
    )


@pytest.fixture
def two_invalid_related_data_foreign_key_tables(_create_two_tables):
    return _create_two_tables(
        'mathesar/tests/data/invalid_reference_base_table.csv',
        'mathesar/tests/data/reference_table.csv',
    )


@pytest.fixture
def _create_two_tables(create_table, get_uid):
    def _create(csv_filepath1, csv_filepath2, table_name1=get_uid(), table_name2=get_uid(), schema_name=get_uid()):
        two_csv_filepaths = (csv_filepath1, csv_filepath2)
        two_table_names = (table_name1, table_name2)
        return tuple(
            create_table(
                table_name=table_name,
                schema_name=schema_name,
                csv_filepath=csv_filepath,
            )
            for table_name, csv_filepath
            in zip(two_table_names, two_csv_filepaths)
        )
    return _create


@pytest.fixture
def table_for_reflection(engine):
    schema_name = 'a_new_schema'
    table_name = 'a_new_table'
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA {schema_name};'))
    with engine.begin() as conn:
        conn.execute(
            text(
                f'CREATE TABLE {schema_name}.{table_name}'
                f' (id INTEGER, name VARCHAR);'
            )
        )
    yield schema_name, table_name, engine
    with engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA {schema_name} CASCADE;'))


@pytest.fixture
def column_test_table(patent_schema):
    engine = patent_schema._sa_engine
    column_list_in = [
        Column("mycolumn0", INTEGER, primary_key=True),
        Column("mycolumn1", INTEGER, nullable=False),
        Column("mycolumn2", INTEGER, server_default="5"),
        Column("mycolumn3", VARCHAR),
    ]
    db_table = SATable(
        "anewtable",
        MetaData(bind=engine),
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    return table


@pytest.fixture
def column_test_table_with_service_layer_options(patent_schema):
    engine = patent_schema._sa_engine
    column_list_in = [
        Column("mycolumn0", INTEGER, primary_key=True),
        Column("mycolumn1", BOOLEAN),
        Column("mycolumn2", INTEGER),
        Column("mycolumn3", VARCHAR),
        Column("mycolumn4", VARCHAR),
        Column("mycolumn5", VARCHAR),
        Column("mycolumn6", TIMESTAMP),
    ]
    column_data_list = [{},
                        {'display_options': {'input': "dropdown", 'custom_labels': {"TRUE": "yes", "FALSE": "no"}}},
                        {'display_options': {'show_as_percentage': True, 'number_format': 'english'}},
                        {},
                        {},
                        {},
                        {'display_options': {'format': 'YYYY-MM-DD hh:mm'}}]
    db_table = SATable(
        "anewtable",
        MetaData(bind=engine),
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    service_columns = []
    for column_data in zip(column_list_in, column_data_list):
        attnum = get_column_attnum_from_name(db_table_oid, column_data[0].name, engine)
        display_options = column_data[1].get('display_options', None)
        first_column = ServiceLayerColumn.current_objects.get_or_create(
            table=table,
            attnum=attnum,
            display_options=display_options,
        )[0]
        service_columns.append(first_column)
    return table, service_columns
