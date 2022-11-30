import json

import pytest
from sqlalchemy import Column as SAColumn, ForeignKey, Integer, MetaData, Table as SATable, select

from db.columns.operations.select import get_column_attnum_from_name
from db.constraints.base import UniqueConstraint
from db.tables.operations.select import get_oid_from_table
from mathesar.models.base import Constraint, Table, Column
from mathesar.api.exceptions.error_codes import ErrorCodes
from db.metadata import get_empty_metadata


def _verify_primary_and_unique_constraints(response):
    response_data = response.json()
    constraints_data = response_data['results']
    assert response.status_code == 200
    assert response_data['count'] == 2
    assert set(['unique', 'primary']) == set([constraint_data['type'] for constraint_data in constraints_data])


def _verify_foreign_key_constraint(
        constraint_data,
        columns,
        name,
        referent_columns,
        referent_table_id,
        onupdate='NO ACTION',
        ondelete='NO ACTION',
        deferrable=False,
):
    assert constraint_data['columns'] == columns
    assert constraint_data['referent_columns'] == referent_columns
    assert constraint_data['referent_table'] == referent_table_id
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'foreignkey'
    assert constraint_data['onupdate'] == onupdate
    assert constraint_data['ondelete'] == ondelete
    assert constraint_data['deferrable'] == deferrable
    assert 'id' in constraint_data and type(constraint_data['id']) == int


def _verify_unique_constraint(constraint_data, columns, name):
    assert constraint_data['columns'] == columns
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'unique'
    assert 'id' in constraint_data and type(constraint_data['id']) == int


write_client_with_different_roles = [
    ('superuser_client_factory', 201),
    ('db_manager_client_factory', 201),
    ('db_editor_client_factory', 403),
    ('schema_manager_client_factory', 201),
    ('schema_viewer_client_factory', 403),
    ('db_viewer_schema_manager_client_factory', 201)
]


list_client_with_different_roles = [
    ('superuser_client_factory', 2, 2),
    ('db_manager_client_factory', 2, 2),
    ('db_editor_client_factory', 2, 2),
    ('schema_manager_client_factory', 2, 0),
    ('schema_viewer_client_factory', 2, 0),
    ('db_viewer_schema_manager_client_factory', 2, 2)
]


delete_client_with_different_roles = [
    ('superuser_client_factory', 204, 204),
    ('db_manager_client_factory', 204, 204),
    ('db_editor_client_factory', 403, 403),
    ('schema_manager_client_factory', 204, 403),
    ('schema_viewer_client_factory', 403, 403),
    ('db_viewer_schema_manager_client_factory', 204, 403)
]


def test_default_constraint_list(create_patents_table, client):
    table_name = 'NASA Constraint List 0'
    table = create_patents_table(table_name)
    constraint_column_id = table.get_columns_by_name(['id'])[0].id

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    constraint_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert constraint_data['columns'] == [constraint_column_id]
    assert 'id' in constraint_data and type(constraint_data['id']) == int
    assert constraint_data['name'] == 'NASA Constraint List 0_pkey'
    assert constraint_data['type'] == 'primary'


@pytest.mark.parametrize('client_name,expected_constraint_count,different_schema_expected_constraint_count', list_client_with_different_roles)
def test_constraint_list_based_on_permissions(
        create_patents_table,
        request,
        client_name,
        expected_constraint_count,
        different_schema_expected_constraint_count
):
    table_name = 'NASA Constraint List 1'
    table = create_patents_table(table_name)
    constraint_column = table.get_columns_by_name(['Case Number'])[0]
    table.add_constraint(UniqueConstraint(None, table.oid, [constraint_column.attnum]))
    different_schema_table = create_patents_table(table_name, schema_name="Different Schema")
    constraint_column = different_schema_table.get_columns_by_name(['Case Number'])[0]
    different_schema_table.add_constraint(
        UniqueConstraint(None, different_schema_table.oid, [constraint_column.attnum])
    )
    client = request.getfixturevalue(client_name)(table.schema)
    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    assert response_data['count'] == expected_constraint_count
    response = client.get(f'/api/db/v0/tables/{different_schema_table.id}/constraints/')
    response_data = response.json()
    assert response_data['count'] == different_schema_expected_constraint_count


def test_existing_foreign_key_constraint_list(patent_schema, client):
    engine = patent_schema._sa_engine
    referent_col_name = "referred_col"
    metadata = MetaData(bind=engine, schema=patent_schema.name)
    referent_table = SATable(
        "referent",
        metadata,
        SAColumn(referent_col_name, Integer, primary_key=True),
        schema=patent_schema.name
    )
    referent_table.create()
    referent_table_oid = get_oid_from_table(referent_table.name, referent_table.schema, engine)
    referent_table = Table.current_objects.create(oid=referent_table_oid, schema=patent_schema)
    fk_column_name = "fk_col"
    column_list_in = [
        SAColumn("mycolumn0", Integer, primary_key=True),
        SAColumn(
            fk_column_name,
            Integer,
            ForeignKey(
                "referent.referred_col",
                onupdate="RESTRICT",
                ondelete="CASCADE",
                deferrable="NOT DEFERABLE",
                match="SIMPLE"
            ),
            nullable=False
        ),
    ]
    db_table = SATable(
        "referrer",
        metadata,
        *column_list_in,
        schema=patent_schema.name
    )
    db_table.create()
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    table = Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    column_attnum = get_column_attnum_from_name(db_table_oid, [fk_column_name], engine, metadata=get_empty_metadata())
    columns = list(Column.objects.filter(table=table, attnum=column_attnum).values_list('id', flat=True))
    referent_column_attnum = get_column_attnum_from_name(referent_table_oid, [referent_col_name], engine, metadata=get_empty_metadata())
    referent_columns = list(Column.objects.filter(table=referent_table, attnum=referent_column_attnum).values_list('id', flat=True))
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'foreignkey':
            _verify_foreign_key_constraint(
                constraint_data,
                columns,
                'referrer_fk_col_fkey',
                referent_columns,
                referent_table.id,
                onupdate="RESTRICT",
                ondelete="CASCADE",
                deferrable=True
            )


def test_multiple_column_constraint_list(create_patents_table, client):
    table_name = 'NASA Constraint List 2'
    table = create_patents_table(table_name)
    constraint_columns = table.get_columns_by_name(['Center', 'Case Number'])
    constraint_column_id_list = [constraint_columns[0].id, constraint_columns[1].id]
    constraint_column_attnum_list = [constraint_columns[0].attnum, constraint_columns[1].attnum]
    table.add_constraint(UniqueConstraint(None, table.oid, constraint_column_attnum_list))

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, constraint_column_id_list, 'NASA Constraint List 2_Center_key')


def test_retrieve_constraint(create_patents_table, client):
    table_name = 'NASA Constraint List 3'
    table = create_patents_table(table_name)
    constraint_column = table.get_columns_by_name(['Case Number'])[0]
    table.add_constraint(UniqueConstraint(None, table.oid, [constraint_column.attnum]))
    list_response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    list_response_data = list_response.json()
    assert list_response_data['count'] == 2
    for constraint_data in list_response_data['results']:
        if constraint_data['type'] == 'unique':
            constraint_id = constraint_data['id']
            break

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/{constraint_id}/')
    assert response.status_code == 200
    _verify_unique_constraint(response.json(), [constraint_column.id], 'NASA Constraint List 3_Case Number_key')


def test_create_multiple_column_unique_constraint(create_patents_table, client):
    table_name = 'NASA Constraint List 4'
    table = create_patents_table(table_name)
    constraint_columns = table.get_columns_by_name(['Center', 'Case Number'])
    constraint_column_1 = constraint_columns[0]
    constraint_column_2 = constraint_columns[1]
    constraint_column_id_list = [constraint_column_1.id, constraint_column_2.id]
    data = {
        'type': 'unique',
        'columns': constraint_column_id_list
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/', data
    )
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), constraint_column_id_list, 'NASA Constraint List 4_Center_key')


def test_create_single_column_unique_constraint(create_patents_table, client):
    table_name = 'NASA Constraint List 5'
    table = create_patents_table(table_name)
    constraint_column_id = table.get_columns_by_name(['Case Number'])[0].id
    data = {
        'type': 'unique',
        'columns': [constraint_column_id]
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), [constraint_column_id], 'NASA Constraint List 5_Case Number_key')


@pytest.mark.parametrize('client_name, expected_status_code', write_client_with_different_roles)
def test_create_unique_constraint_by_different_roles(create_patents_table, request, client_name, expected_status_code):
    table_name = 'NASA Constraint List 5'
    table = create_patents_table(table_name)
    constraint_column_id = table.get_columns_by_name(['Case Number'])[0].id
    data = {
        'type': 'unique',
        'columns': [constraint_column_id]
    }
    client = request.getfixturevalue(client_name)(table.schema)
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == expected_status_code


def test_create_unique_constraint_with_name_specified(create_patents_table, client):
    table_name = 'NASA Constraint List 6'
    table = create_patents_table(table_name)
    constraint_columns = table.get_columns_by_name(['Case Number'])
    constraint_column_id_list = [constraint_columns[0].id]
    data = {
        'name': 'awesome_constraint',
        'type': 'unique',
        'columns': constraint_column_id_list
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/', data)
    assert response.status_code == 201
    _verify_unique_constraint(response.json(), constraint_column_id_list, 'awesome_constraint')


def test_create_single_column_foreign_key_constraint(two_foreign_key_tables, client):
    referrer_table, referent_table = two_foreign_key_tables
    referent_column = referent_table.get_columns_by_name(["Id"])[0]
    referrer_column = referrer_table.get_columns_by_name(["Center"])[0]
    referent_table.add_constraint(
        UniqueConstraint(None, referent_table.oid, [referent_column.attnum])
    )
    data = {
        'type': 'foreignkey',
        'columns': [referrer_column.id],
        'referent_columns': [referent_column.id]
    }
    response = client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)
    assert response.status_code == 201
    fk_name = referrer_table.name + '_Center_fkey'
    _verify_foreign_key_constraint(
        response.json(), [referrer_column.id], fk_name,
        [referent_column.id], referent_table.id
    )


def test_create_single_column_foreign_key_constraint_with_options(
    two_foreign_key_tables, client
):
    referrer_table, referent_table = two_foreign_key_tables
    referent_column = referent_table.get_columns_by_name(["Id"])[0]
    referrer_column = referrer_table.get_columns_by_name(["Center"])[0]
    referent_table.add_constraint(
        UniqueConstraint(None, referent_table.oid, [referent_column.attnum])
    )
    data = {
        'type': 'foreignkey',
        'columns': [referrer_column.id],
        'referent_columns': [referent_column.id],
        'onupdate': "RESTRICT",
        'ondelete': "CASCADE",
        'deferrable': False,
    }
    response = client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)
    assert response.status_code == 201
    fk_name = referrer_table.name + '_Center_fkey'
    _verify_foreign_key_constraint(
        response.json(), [referrer_column.id], fk_name,
        [referent_column.id],
        referent_table.id,
        onupdate='RESTRICT',
        ondelete='CASCADE',
        deferrable=False,
    )


def test_create_self_referential_single_column_foreign_key_constraint(
    self_referential_table, client, engine
):
    table = self_referential_table
    column = table.get_columns_by_name(["Id"])[0]
    parent_column = table.get_columns_by_name(["Parent"])[0]
    table.add_constraint(UniqueConstraint(None, table.oid, [column.attnum]))

    data = {
        'type': 'foreignkey',
        'columns': [parent_column.id],
        'referent_columns': [column.id]
    }
    response = client.post(f'/api/db/v0/tables/{table.id}/constraints/', data)
    assert response.status_code == 201
    fk_name = table.name + '_Parent_fkey'
    _verify_foreign_key_constraint(
        response.json(), [parent_column.id], fk_name,
        [column.id], table.id
    )
    # Recursively fetch children
    with engine.begin() as conn:
        sa_table = table._sa_table
        head = select(sa_table).filter(sa_table.c.Id == "1").cte(recursive=True)
        u = head.union_all(select(sa_table).join(head, sa_table.c.Parent == head.c.Id))
        stmt = select(u.c.Id)
        created_default = conn.execute(stmt).fetchall()
        assert created_default == [("1",), ("2", ), ("4", )]


def test_create_single_column_foreign_key_constraint_invalid_related_data(
    two_invalid_related_data_foreign_key_tables, client
):
    referrer_table, referent_table = two_invalid_related_data_foreign_key_tables
    referent_column = referent_table.get_columns_by_name(["Id"])[0]
    referrer_column = referrer_table.get_columns_by_name(["Center"])[0]
    referent_table.add_constraint(UniqueConstraint(None, referent_table.oid, [referent_column.attnum]))

    data = {
        'type': 'foreignkey',
        'columns': [referrer_column.id],
        'referent': {'table': referent_table.id, 'columns': [referent_column.id]}
    }
    response = client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)
    assert response.status_code == 400


def test_create_multiple_column_foreign_key_constraint(
    two_multi_column_foreign_key_tables, client
):
    referrer_table, referent_table = two_multi_column_foreign_key_tables
    referent_columns = referent_table.get_columns_by_name(['Name', 'City'])
    referrer_columns = referrer_table.get_columns_by_name(["Center", 'Center City'])
    referent_columns_id = [referent_column.id for referent_column in referent_columns]
    referrer_columns_id = [referrer_column.id for referrer_column in referrer_columns]
    referent_table.add_constraint(
        UniqueConstraint(
            None, referent_table.oid, [referent_column.attnum for referent_column in referent_columns]
        )
    )

    data = {
        'type': 'foreignkey',
        'columns': referrer_columns_id,
        'referent_columns': referent_columns_id
    }
    response = client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)
    assert response.status_code == 201
    fk_name = referrer_table.name + '_Center_fkey'
    _verify_foreign_key_constraint(
        response.json(), referrer_columns_id, fk_name, referent_columns_id, referent_table.id
    )


def test_drop_constraint(create_patents_table, client):
    table_name = 'NASA Constraint List 7'
    table = create_patents_table(table_name)

    constraint_column = table.get_columns_by_name(['Case Number'])[0]
    table.add_constraint(UniqueConstraint(None, table.oid, [constraint_column.attnum]))
    list_response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    list_response_data = list_response.json()
    assert list_response_data['count'] == 2
    for constraint_data in list_response_data['results']:
        if constraint_data['type'] == 'unique':
            constraint_id = constraint_data['id']
            break

    response = client.delete(f'/api/db/v0/tables/{table.id}/constraints/{constraint_id}/')
    assert response.status_code == 204
    new_list_response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    assert new_list_response.json()['count'] == 1


def _first_unique_constraint(table):
    constraints = Constraint.objects.filter(table=table)
    for constraint_data in constraints:
        if constraint_data.type == 'unique':
            constraint_id = constraint_data. id
            break
    return constraint_id


def test_create_unique_constraint_with_duplicate_name(create_patents_table, client):
    table_name = 'NASA Constraint List 8'
    table = create_patents_table(table_name)
    constraint_columns = table.get_columns_by_name(['Center', 'Case Number'])
    constraint_column_id_list = [constraint_columns[0].id, constraint_columns[1].id]
    constraint_column_attnum_list = [constraint_columns[0].attnum, constraint_columns[1].attnum]
    table.add_constraint(UniqueConstraint(None, table.oid, constraint_column_attnum_list))
    data = {
        'type': 'unique',
        'columns': constraint_column_id_list
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 400
    response_body = response.json()[0]
    assert response_body['message'] == 'Relation with the same name already exists'
    assert response_body['code'] == ErrorCodes.DuplicateTableError.value


def test_create_unique_constraint_for_non_unique_column(create_patents_table, client):
    table_name = 'NASA Constraint List 9'
    table = create_patents_table(table_name)
    constraint_column = table.get_columns_by_name(['Center'])[0]
    data = {
        'type': 'unique',
        'columns': [constraint_column.id]
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 400
    response_body = response.json()[0]
    assert response_body['message'] == 'This column has non-unique values so a unique constraint cannot be set'
    assert response_body['code'] == ErrorCodes.UniqueViolation.value


def test_drop_nonexistent_constraint(create_patents_table, client):
    table_name = 'NASA Constraint List 10'
    table = create_patents_table(table_name)

    response = client.delete(f'/api/db/v0/tables/{table.id}/constraints/345/')
    assert response.status_code == 404
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value


@pytest.mark.parametrize('client_name, expected_status_code, different_schema_expected_status_code', delete_client_with_different_roles)
def test_drop_constraint_based_on_permission(create_patents_table, request, client_name, expected_status_code, different_schema_expected_status_code):
    table_name = 'NASA Constraint List 1'
    table = create_patents_table(table_name)
    constraint_column = table.get_columns_by_name(['Case Number'])[0]
    table.add_constraint(UniqueConstraint(None, table.oid, [constraint_column.attnum]))
    different_schema_table = create_patents_table(table_name, schema_name="Different Schema")
    constraint_column = different_schema_table.get_columns_by_name(['Case Number'])[0]
    different_schema_table.add_constraint(
        UniqueConstraint(None, different_schema_table.oid, [constraint_column.attnum])
    )
    client = request.getfixturevalue(client_name)(table.schema)
    constraint_id = _first_unique_constraint(table)
    response = client.delete(f'/api/db/v0/tables/{table.id}/constraints/{constraint_id}/')
    assert response.status_code == expected_status_code
    different_schema_table_constraint_id = _first_unique_constraint(different_schema_table)
    response = client.delete(f'/api/db/v0/tables/{different_schema_table.id}/constraints/{different_schema_table_constraint_id}/')
    assert response.status_code == different_schema_expected_status_code


def test_drop_nonexistent_table(client):
    response = client.delete('/api/db/v0/tables/9387489/constraints/4234/')
    assert response.status_code == 404
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value


def test_empty_column_list(create_patents_table, client):
    table_name = 'NASA Constraint List 11'
    table = create_patents_table(table_name)
    data = {
        'type': 'unique',
        'columns': []
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/', data
    )
    response_data = response.json()[0]
    assert response.status_code == 400
    assert response_data['code'] == ErrorCodes.ConstraintColumnEmpty.value
    assert response_data['message'] == 'Constraint column field cannot be empty'


def test_invalid_constraint_type(create_patents_table, client):
    table_name = 'NASA Constraint List 12'
    table = create_patents_table(table_name)
    invalid_constraint = 'foo'
    data = {
        'type': invalid_constraint,
        'columns': [1]
    }
    response = client.post(
        f'/api/db/v0/tables/{table.id}/constraints/', data
    )
    response_data = response.json()[0]
    assert response.status_code == 400
    assert response_data['code'] == ErrorCodes.UnsupportedConstraint.value
    assert f'Operations related to {invalid_constraint} constraint are currently not supported' in response_data['message']
