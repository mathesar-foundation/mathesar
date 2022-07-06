import pytest
from sqlalchemy import Column, Integer, MetaData, String
from sqlalchemy import Table as SATable

from db.constraints.utils import ConstraintType
from db.tables.operations.select import get_oid_from_table
from db.tables.utils import get_primary_key_column

from mathesar.models.base import Constraint, Table


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
    table = Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    return table


def test_one_to_one_link_create(column_test_table, client, create_patents_table):
    table_2 = create_patents_table('Table 2')
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
    constraints = Constraint.objects.filter(table=table_2)
    assert constraints.count() == 3

    unique_constraint = next(
        constraint
        for constraint in constraints
        if constraint.type == ConstraintType.UNIQUE.value
    )
    fk_constraint = next(
        constraint
        for constraint in constraints
        if constraint.type == ConstraintType.FOREIGN_KEY.value
    )
    unique_constraint_columns = list(unique_constraint.columns.all())
    fk_constraint_columns = list(fk_constraint.columns.all())
    referent_columns = list(fk_constraint.referent_columns.all())
    assert unique_constraint_columns == table_2.get_columns_by_name(['col_1'])
    assert fk_constraint_columns == table_2.get_columns_by_name(['col_1'])
    referent_primary_key_column_name = get_primary_key_column(column_test_table._sa_table).name
    assert referent_columns == column_test_table.get_columns_by_name([referent_primary_key_column_name])


def test_one_to_many_link_create(column_test_table, client, create_patents_table):
    table_2 = create_patents_table('Table 2')
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
    constraints = Constraint.objects.filter(table=table_2)
    assert constraints.count() == 2

    fk_constraint = next(
        constraint
        for constraint in constraints
        if constraint.type == ConstraintType.FOREIGN_KEY.value
    )
    fk_constraint_columns = list(fk_constraint.columns.all())
    referent_columns = list(fk_constraint.referent_columns.all())
    assert fk_constraint_columns == table_2.get_columns_by_name(['col_1'])
    referent_primary_key_column_name = get_primary_key_column(column_test_table._sa_table).name
    assert referent_columns == column_test_table.get_columns_by_name([referent_primary_key_column_name])


def test_one_to_many_self_referential_link_create(column_test_table, client):
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
    constraints = Constraint.objects.filter(table=column_test_table)
    assert constraints.count() == 2

    fk_constraint = next(
        constraint
        for constraint in constraints
        if constraint.type == ConstraintType.FOREIGN_KEY.value
    )
    fk_constraint_columns = list(fk_constraint.columns.all())
    referent_columns = list(fk_constraint.referent_columns.all())
    assert fk_constraint_columns == column_test_table.get_columns_by_name(['col_1'])
    referent_primary_key_column_name = get_primary_key_column(column_test_table._sa_table).name
    assert referent_columns == column_test_table.get_columns_by_name([referent_primary_key_column_name])


def test_many_to_many_self_referential_link_create(column_test_table, client):
    schema = column_test_table.schema
    engine = schema._sa_engine
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
    map_table_oid = get_oid_from_table("map_table", schema.name, engine)
    map_table = Table.objects.get(oid=map_table_oid)
    constraints = Constraint.objects.filter(table=map_table)
    assert constraints.count() == 3


def test_many_to_many_link_create(column_test_table, client, create_patents_table):
    table_2 = create_patents_table('Table 2')
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
