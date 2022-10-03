from pathlib import Path

from django.core.files import File
import pytest
from sqlalchemy import Column, INTEGER, VARCHAR, MetaData, BOOLEAN, TIMESTAMP, text
from sqlalchemy import Table as SATable

from db.columns.operations.select import get_column_attnum_from_name
from db.constraints.base import ForeignKeyConstraint, UniqueConstraint
from db.tables.operations.select import get_oid_from_table
from db.types.base import PostgresType
from mathesar.models.base import Table, DataFile, Column as ServiceLayerColumn


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
def two_foreign_key_tables(_create_tables_from_files):
    return _create_tables_from_files(
        'mathesar/tests/data/base_table.csv',
        'mathesar/tests/data/reference_table.csv',
    )


@pytest.fixture
def publication_tables(_create_tables_from_files, client):
    author_table, publisher_table, publication_table, checkouts_table = _create_tables_from_files(
        'mathesar/tests/data/relation_tables/author.csv',
        'mathesar/tests/data/relation_tables/publisher.csv',
        'mathesar/tests/data/relation_tables/publication.csv',
        'mathesar/tests/data/relation_tables/items.csv',
    )
    author_table_pk_column = author_table.get_column_by_name("id")
    author_table.add_constraint(UniqueConstraint(None, author_table.oid, [author_table_pk_column.attnum]))
    publisher_table_pk_column = publisher_table.get_column_by_name("id")
    publisher_table.add_constraint(UniqueConstraint(None, publisher_table.oid, [publisher_table_pk_column.attnum]))
    publication_table_columns = publication_table.get_columns_by_name(["id", "publisher", "author", "co_author"])
    publication_table_pk_column = publication_table_columns[0]
    publication_table.add_constraint(
        UniqueConstraint(
            None,
            publication_table.oid,
            [publication_table_pk_column.attnum]
        )
    )
    checkouts_table_columns = checkouts_table.get_columns_by_name(["id", "publication"])
    checkouts_table_pk_column = checkouts_table_columns[0]
    checkouts_table_publication_column = checkouts_table_columns[1]
    checkouts_table.add_constraint(
        UniqueConstraint(
            None,
            checkouts_table.oid,
            [checkouts_table_pk_column.attnum]
        )
    )
    db_type = PostgresType.INTEGER
    data = {"type": db_type.id}
    # TODO Uncomment when DB query bug is fixed
    publication_publisher_column = publication_table_columns[1]
    publication_author_column = publication_table_columns[2]
    publication_co_author_column = publication_table_columns[3]
    client.patch(
        f"/api/db/v0/tables/{publication_table.id}/columns/{publication_publisher_column.id}/", data=data
    )
    publication_table.add_constraint(
        ForeignKeyConstraint(
            None,
            publication_table.oid,
            [publication_publisher_column.attnum],
            publisher_table.oid,
            [publisher_table_pk_column.attnum], {}
        )
    )
    client.patch(
        f"/api/db/v0/tables/{publication_table.id}/columns/{publication_author_column.id}/", data=data
    )
    publication_table.add_constraint(
        ForeignKeyConstraint(
            None,
            publication_table.oid,
            [publication_author_column.attnum],
            author_table.oid,
            [author_table_pk_column.attnum], {}
        )
    )
    client.patch(
        f"/api/db/v0/tables/{publication_table.id}/columns/{publication_co_author_column.id}/", data=data
    )
    publication_table.add_constraint(
        ForeignKeyConstraint(
            None,
            publication_table.oid,
            [publication_co_author_column.attnum],
            author_table.oid,
            [author_table_pk_column.attnum], {}
        )
    )
    client.patch(
        f"/api/db/v0/tables/{checkouts_table.id}/columns/{checkouts_table_publication_column.id}/", data=data
    )
    checkouts_table.add_constraint(
        ForeignKeyConstraint(
            None,
            checkouts_table.oid,
            [checkouts_table_publication_column.attnum],
            publication_table.oid,
            [publication_table_pk_column.attnum], {}
        )
    )
    return author_table, publisher_table, publication_table, checkouts_table


@pytest.fixture
def two_multi_column_foreign_key_tables(_create_tables_from_files):
    return _create_tables_from_files(
        'mathesar/tests/data/multi_column_foreign_key_base_table.csv',
        'mathesar/tests/data/multi_column_reference_table.csv',
    )


@pytest.fixture
def two_invalid_related_data_foreign_key_tables(_create_tables_from_files):
    return _create_tables_from_files(
        'mathesar/tests/data/invalid_reference_base_table.csv',
        'mathesar/tests/data/reference_table.csv',
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
