from pathlib import Path

from django.core.files import File
import pytest
from sqlalchemy import Column, INTEGER, VARCHAR, MetaData, BOOLEAN, TIMESTAMP, text
from sqlalchemy import Table as SATable

from db.columns.operations.select import get_column_attnum_from_name
from db.constraints.base import ForeignKeyConstraint, UniqueConstraint
from db.tables.operations.select import get_oid_from_table
from db.types.base import PostgresType
from mathesar.models.deprecated import Table, DataFile, Column as ServiceLayerColumn
from db.metadata import get_empty_metadata
from mathesar.state import reset_reflection


@pytest.fixture
def create_data_file():
    def _create_data_file(file_path, file_name):
        with open(file_path, 'rb') as csv_file:
            data_file = DataFile.objects.create(
                file=File(csv_file), created_from='file',
                base_name=file_name, type='csv'
            )

        return data_file
    return _create_data_file


@pytest.fixture
def self_referential_table(create_table, get_uid):
    return create_table(
        table_name=get_uid(),
        schema_name=get_uid(),
        csv_filepath='mathesar/tests/data/self_referential_table.csv',
    )


@pytest.fixture
def _create_tables_from_files(create_table, get_uid):
    def _create(*csv_files):
        table_names = [get_uid() for i in range(len(csv_files))]
        schema_name = get_uid()
        return tuple(
            create_table(
                table_name=Path(csv_filepath).stem,
                schema_name=schema_name,
                csv_filepath=csv_filepath,
            )
            for table_name, csv_filepath
            in zip(table_names, csv_files)
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
    metadata = get_empty_metadata()
    for sa_column in column_list_in:
        attnum = get_column_attnum_from_name(db_table_oid, sa_column.name, engine, metadata=metadata)
        ServiceLayerColumn.current_objects.get_or_create(
            table=table,
            attnum=attnum,
        )
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
        attnum = get_column_attnum_from_name(db_table_oid, column_data[0].name, engine, metadata=get_empty_metadata())
        display_options = column_data[1].get('display_options', None)
        first_column = ServiceLayerColumn.current_objects.get_or_create(
            table=table,
            attnum=attnum,
            display_options=display_options,
        )[0]
        service_columns.append(first_column)
    return table, service_columns


@pytest.fixture
def library_ma_tables(db_table_to_dj_table, library_db_tables):
    reset_reflection()
    return {
        table_name: db_table_to_dj_table(db_table)
        for table_name, db_table
        in library_db_tables.items()
    }


@pytest.fixture
def payments_ma_table(db_table_to_dj_table, payments_db_table):
    reset_reflection()
    return db_table_to_dj_table(payments_db_table)


@pytest.fixture
def players_ma_table(db_table_to_dj_table, players_db_table):
    reset_reflection()
    return db_table_to_dj_table(players_db_table)


@pytest.fixture
def athletes_ma_table(db_table_to_dj_table, athletes_db_table):
    reset_reflection()
    return db_table_to_dj_table(athletes_db_table)


@pytest.fixture
def table_with_unknown_types(create_schema, get_uid, engine):
    prefix = "unknown_types"
    schema_name = f"schema_{prefix}_{get_uid()}"
    schema = create_schema(schema_name)
    db_name = schema.database.name
    table_name = f"table_{prefix}_{get_uid()}"
    fq_table_name = f"\"{schema_name}\".\"{table_name}\""
    query = f"""
        SET search_path="{schema_name}";
        CREATE EXTENSION IF NOT EXISTS citext;
        CREATE TABLE {fq_table_name} (
            text_column CITEXT,
            point_column POINT
        );
        INSERT INTO {fq_table_name} (text_column, point_column)
        VALUES
            ('Row 1', '(1.23, 4.56)'),
            ('Row 2', '(7.89, 0.12)'),
            ('Row 3', '(3.45, 6.78)');
    """
    with engine.connect() as conn:
        conn.execute(text(query))
        conn.commit()
    reset_reflection(db_name=db_name)
    # NOTE filtering by name is impossible here, because db object names are a dynamic properties, not model fields
    all_tables = Table.current_objects.all()
    for table in all_tables:
        if table.name == table_name:
            return table
    raise Exception("Should never happen.")
