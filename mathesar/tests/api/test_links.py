import pytest
from sqlalchemy import Column, Integer, MetaData, String
from sqlalchemy import Table as SATable

from db.constraints.utils import ConstraintType
from db.tables.operations.select import get_oid_from_table
from db.tables.utils import get_primary_key_column

from mathesar.models.base import Constraint, Table
from mathesar.api.exceptions.error_codes import ErrorCodes


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


write_clients_with_status_code = [
    ('superuser_client_factory', 201),
    ('db_manager_client_factory', 201),
    ('db_editor_client_factory', 400),
    ('schema_manager_client_factory', 201),
    ('schema_viewer_client_factory', 400),
    ('db_viewer_schema_manager_client_factory', 201)
]


@pytest.mark.parametrize('client_name, expected_status_code', write_clients_with_status_code)
def test_one_to_one_link_create_permissions(
        column_test_table,
        request,
        create_patents_table,
        client_name,
        expected_status_code
):
    table_2 = create_patents_table('Table 2')
    client = request.getfixturevalue(client_name)(table_2.schema)

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
    assert response.status_code == expected_status_code


def test_one_to_many_link_on_invalid_table_name(
        create_base_table,
        create_referent_table,
        client
):
    reference_table = create_base_table('Base_table')
    # Having round brackets in the referent_table name is invalid.
    referent_table = create_referent_table('Referent_table(alpha)')
    data = {
        "link_type": "one-to-many",
        "reference_column_name": "col_1",
        "reference_table": reference_table.id,
        "referent_table": referent_table.id,
    }
    response = client.post(
        "/api/db/v0/links/",
        data=data,
    )
    response_data = response.json()[0]
    assert response.status_code == 400
    assert response_data['code'] == ErrorCodes.InvalidTableName.value
    assert response_data['message'] == 'Table name "Referent_table(alpha)" is invalid.'
    assert response_data['field'] == 'referent_table'


def test_one_to_one_link_on_invalid_table_name(
        create_base_table,
        create_referent_table,
        client
):
    reference_table = create_base_table('Base_table')
    # Having round brackets in the referent_table name is invalid.
    referent_table = create_referent_table('Referent_table(alpha)')
    data = {
        "link_type": "one-to-one",
        "reference_column_name": "col_1",
        "reference_table": reference_table.id,
        "referent_table": referent_table.id,
    }
    response = client.post(
        "/api/db/v0/links/",
        data=data,
    )
    response_data = response.json()[0]
    assert response.status_code == 400
    assert response_data['code'] == ErrorCodes.InvalidTableName.value
    assert response_data['message'] == 'Table name "Referent_table(alpha)" is invalid.'
    assert response_data['field'] == 'referent_table'


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


@pytest.mark.parametrize('client_name, expected_status_code', write_clients_with_status_code)
def test_one_to_many_link_create_permissions(
        column_test_table,
        request,
        create_patents_table,
        client_name,
        expected_status_code
):

    table_2 = create_patents_table('Table 2')
    client = request.getfixturevalue(client_name)(table_2.schema)

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
    assert response.status_code == expected_status_code


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


def test_many_to_many_link_invalid_table_name(
    column_test_table,
    client,
    create_patents_table
):
    table_2 = create_patents_table('Referent_table(alpha)')
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
    response_data = response.json()[0]
    assert response.status_code == 400
    assert response_data['code'] == ErrorCodes.InvalidTableName.value
    assert response_data['message'] == 'Table name "Referent_table(alpha)" is invalid.'
    assert response_data['field'] == 'referents'


@pytest.mark.parametrize('client_name, expected_status_code', write_clients_with_status_code)
def test_many_to_many_link_create_permissions(
        column_test_table,
        request,
        create_patents_table,
        client_name,
        expected_status_code
):
    table_2 = create_patents_table('Table 2')
    client = request.getfixturevalue(client_name)(table_2.schema)
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
    assert response.status_code == expected_status_code
