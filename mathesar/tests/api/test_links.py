import pytest
from sqlalchemy import Column, Integer, MetaData, String
from sqlalchemy import Table as SATable
from django.core.cache import cache

from db.tables.operations.select import get_oid_from_table
from db.tests.types import fixtures
from mathesar import models

engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


@pytest.fixture
def column_test_table(patent_schema):
    engine = patent_schema._sa_engine
    column_list_in = [
        Column("mycolumn0", Integer, primary_key=True),
        Column("mycolumn1", Integer, nullable=False),
        Column("mycolumn2", Integer, server_default="5"),
        Column("mycolumn3", String),
    ]
    db_table = SATable(
        "anewtable",
        MetaData(bind=engine),
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = models.Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    return table


def test_one_to_one_link_create(column_test_table, client, create_table):
    cache.clear()
    table_2 = create_table('Table 2')
    data = {
        "link_type": "one-to-one",
        "reference_column_name": "col_1",
        "reference_table": table_2.id,
        "referent_table": column_test_table.id,
    }
    response = client.post(
        "/api/db/v0/links/",
        data=data,
    )
    assert response.status_code == 201


def test_one_to_many_link_create(column_test_table, client, create_table):
    cache.clear()
    table_2 = create_table('Table 2')
    data = {
        "link_type": "one-to-many",
        "reference_column_name": "col_1",
        "reference_table": table_2.id,
        "referent_table": column_test_table.id,
    }
    response = client.post(
        "/api/db/v0/links/",
        data=data,
    )
    assert response.status_code == 201


def test_one_to_many_self_referential_link_create(column_test_table, client):
    cache.clear()
    data = {
        "link_type": "one-to-many",
        "reference_column_name": "col_1",
        "reference_table": column_test_table.id,
        "referent_table": column_test_table.id,
    }
    response = client.post(
        "/api/db/v0/links/",
        data=data,
    )
    assert response.status_code == 201


def test_many_to_many_self_referential_link_create(column_test_table, client):
    cache.clear()
    data = {
        "link_type": "many-to-many",
        "mapping_table_name": "map_table",
        "referents": [
            {'referent_table': column_test_table.id, 'column_name': "link_1"},
            {'referent_table': column_test_table.id, 'column_name': "link_2"}
        ],
    }
    response = client.post(
        "/api/db/v0/links/",
        data=data,
    )
    assert response.status_code == 201


def test_many_to_many_link_create(column_test_table, client, create_table):
    cache.clear()
    table_2 = create_table('Table 2')
    data = {
        "link_type": "many-to-many",
        "mapping_table_name": "map_table",
        "referents": [
            {'referent_table': column_test_table.id, 'column_name': "link_1"},
            {'referent_table': table_2.id, 'column_name': "link_2"}
        ],
    }
    response = client.post(
        "/api/db/v0/links/",
        data=data,
    )
    assert response.status_code == 201
