import json

from django.core.cache import cache
from sqlalchemy import Column, ForeignKey, Integer, MetaData, Table as SATable, select

from db.columns.operations.select import get_column_attnum_from_name
from db.constraints.base import UniqueConstraint
from db.tables.operations.select import get_oid_from_table
from mathesar import models
from mathesar.api.exceptions.error_codes import ErrorCodes


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
        constraint_options=None
):
    assert constraint_data['columns'] == columns
    assert constraint_data['referent_columns'] == referent_columns
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'foreignkey'
    if constraint_options:
        assert constraint_data['onupdate'] == constraint_options['onupdate']
        assert constraint_data['ondelete'] == constraint_options['ondelete']
        assert constraint_data['deferrable'] == constraint_options['deferrable']
    assert 'id' in constraint_data and type(constraint_data['id']) == int


def _verify_unique_constraint(constraint_data, columns, name):
    assert constraint_data['columns'] == columns
    assert constraint_data['name'] == name
    assert constraint_data['type'] == 'unique'
    assert 'id' in constraint_data and type(constraint_data['id']) == int


def _get_columns_by_name(table, name_list):
    columns_by_name_dict = {
        col.name: col for col in table.columns.all() if col.name in name_list
    }
    return [columns_by_name_dict[col_name] for col_name in name_list]


def test_default_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 0'
    table = create_table(table_name)
    constraint_column_id = _get_columns_by_name(table, ['id'])[0].id

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    constraint_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert constraint_data['columns'] == [constraint_column_id]
    assert 'id' in constraint_data and type(constraint_data['id']) == int
    assert constraint_data['name'] == 'NASA Constraint List 0_pkey'
    assert constraint_data['type'] == 'primary'


def test_multiple_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 1'
    table = create_table(table_name)
    constraint_column = _get_columns_by_name(table, ['Case Number'])[0]
    table.add_constraint(UniqueConstraint(None, table.oid, [constraint_column.attnum]))
    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, [constraint_column.id], 'NASA Constraint List 1_Case Number_key')


def test_existing_foreign_key_constraint_list(patent_schema, create_table, create_column, client):
    cache.clear()
    engine = patent_schema._sa_engine
    referent_col_name = "referred_col"
    metadata = MetaData(bind=engine, schema=patent_schema.name)
    referent_table = SATable(
        "referent",
        metadata,
        Column(referent_col_name, Integer, primary_key=True),
        schema=patent_schema.name
    )
    referent_table.create()
    referent_table_oid = get_oid_from_table(referent_table.name, referent_table.schema, engine)
    referent_table = models.Table.current_objects.create(oid=referent_table_oid, schema=patent_schema)
    fk_column_name = "fk_col"
    column_list_in = [
        Column("mycolumn0", Integer, primary_key=True),
        Column(
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
    table = models.Table.current_objects.create(oid=db_table_oid, schema=patent_schema)
    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()
    column_attnum = get_column_attnum_from_name(db_table_oid, [fk_column_name], engine)
    columns = list(models.Column.objects.filter(table=table, attnum=column_attnum).values_list('id', flat=True))
    referent_column_attnum = get_column_attnum_from_name(referent_table_oid, [referent_col_name], engine)
    referent_columns = list(models.Column.objects.filter(table=referent_table, attnum=referent_column_attnum).values_list('id', flat=True))
    constraint_options = {'onupdate': "RESTRICT", 'ondelete': "CASCADE", 'deferrable': True}
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'foreignkey':
            _verify_foreign_key_constraint(
                constraint_data,
                columns,
                'referrer_fk_col_fkey',
                referent_columns,
                constraint_options
            )


def test_multiple_column_constraint_list(create_table, client):
    table_name = 'NASA Constraint List 2'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Center', 'Case Number'])
    constraint_column_id_list = [constraint_columns[0].id, constraint_columns[1].id]
    constraint_column_attnum_list = [constraint_columns[0].attnum, constraint_columns[1].attnum]
    table.add_constraint(UniqueConstraint(None, table.oid, constraint_column_attnum_list))

    response = client.get(f'/api/db/v0/tables/{table.id}/constraints/')
    response_data = response.json()

    _verify_primary_and_unique_constraints(response)
    for constraint_data in response_data['results']:
        if constraint_data['type'] == 'unique':
            _verify_unique_constraint(constraint_data, constraint_column_id_list, 'NASA Constraint List 2_Center_key')


def test_retrieve_constraint(create_table, client):
    table_name = 'NASA Constraint List 3'
    table = create_table(table_name)
    constraint_column = _get_columns_by_name(table, ['Case Number'])[0]
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


def test_create_multiple_column_unique_constraint(create_table, client):
    table_name = 'NASA Constraint List 4'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Center', 'Case Number'])
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


def test_create_single_column_unique_constraint(create_table, client):
    table_name = 'NASA Constraint List 5'
    table = create_table(table_name)
    constraint_column_id = _get_columns_by_name(table, ['Case Number'])[0].id
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


def test_create_unique_constraint_with_name_specified(create_table, client):
    table_name = 'NASA Constraint List 6'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Case Number'])
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


def test_create_single_column_foreign_key_constraint(create_foreign_key_table, client):
    referrer_table_name = 'Patents'
    referent_table_name = 'Center'
    referrer_table, referent_table = create_foreign_key_table(referrer_table_name, referent_table_name)
    referent_column = _get_columns_by_name(referent_table, ["Id"])[0]
    referrer_column = _get_columns_by_name(referrer_table, ["Center"])[0]
    referent_table.add_constraint(UniqueConstraint(None, referent_table.oid, [referent_column.attnum]))
    data = {
        'type': 'foreignkey',
        'columns': [referrer_column.id],
        'referent_columns': [referent_column.id]
    }
    response = client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)
    assert response.status_code == 201
    _verify_foreign_key_constraint(response.json(), [referrer_column.id], 'Patents_Center_fkey',
                                   [referent_column.id])


def test_create_single_column_foreign_key_constraint_with_options(create_foreign_key_table, client):
    referrer_table_name = 'Patents'
    referent_table_name = 'Center'
    referrer_table, referent_table = create_foreign_key_table(referrer_table_name, referent_table_name)
    referent_column = _get_columns_by_name(referent_table, ["Id"])[0]
    referrer_column = _get_columns_by_name(referrer_table, ["Center"])[0]
    referent_table.add_constraint(UniqueConstraint(None, referent_table.oid, [referent_column.attnum]))
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
    _verify_foreign_key_constraint(
        response.json(), [referrer_column.id], 'Patents_Center_fkey',
        [referent_column.id],
        {'onupdate': 'RESTRICT', 'ondelete': 'CASCADE', 'deferrable': None}
    )


def test_create_self_referential_single_column_foreign_key_constraint(create_self_referential_table, client, engine):
    table_name = 'Tree'
    table = create_self_referential_table(table_name)
    column = _get_columns_by_name(table, ["Id"])[0]
    parent_column = _get_columns_by_name(table, ["Parent"])[0]
    table.add_constraint(UniqueConstraint(None, table.oid, [column.attnum]))

    data = {
        'type': 'foreignkey',
        'columns': [parent_column.id],
        'referent_columns': [column.id]
    }
    response = client.post(f'/api/db/v0/tables/{table.id}/constraints/', data)
    assert response.status_code == 201
    _verify_foreign_key_constraint(response.json(), [parent_column.id], 'Tree_Parent_fkey',
                                   [column.id])
    # Recursively fetch children
    with engine.begin() as conn:
        sa_table = table._sa_table
        head = select(sa_table).filter(sa_table.c.Id == "1").cte(recursive=True)
        u = head.union_all(select(sa_table).join(head, sa_table.c.Parent == head.c.Id))
        stmt = select(u.c.Id)
        created_default = conn.execute(stmt).fetchall()
        assert created_default == [("1",), ("2", ), ("4", )]


def test_create_single_column_foreign_key_constraint_invalid_related_data(create_invalid_related_data_foreign_key_table,
                                                                          client):
    referrer_table_name = 'Patents'
    referent_table_name = 'Center'
    referrer_table, referent_table = create_invalid_related_data_foreign_key_table(referrer_table_name, referent_table_name)
    referent_column = _get_columns_by_name(referent_table, ["Id"])[0]
    referrer_column = _get_columns_by_name(referrer_table, ["Center"])[0]
    referent_table.add_constraint(UniqueConstraint(None, referent_table.oid, [referent_column.attnum]))

    data = {
        'type': 'foreignkey',
        'columns': [referrer_column.id],
        'referent': {'table': referent_table.id, 'columns': [referent_column.id]}
    }
    response = client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)
    assert response.status_code == 400


def test_create_multiple_column_foreign_key_constraint(create_multi_column_foreign_key_table, client):
    referrer_table_name = 'Patents'
    referent_table_name = 'Center'
    referrer_table, referent_table = create_multi_column_foreign_key_table(referrer_table_name, referent_table_name)
    referent_columns = _get_columns_by_name(referent_table, ['Name', 'City'])
    referrer_columns = _get_columns_by_name(referrer_table, ["Center", 'Center City'])
    referent_columns_id = [referent_column.id for referent_column in referent_columns]
    referrer_columns_id = [referrer_column.id for referrer_column in referrer_columns]
    referent_table.add_constraint(UniqueConstraint(None, referent_table.oid, [referent_column.attnum for referent_column in referent_columns]))

    data = {
        'type': 'foreignkey',
        'columns': referrer_columns_id,
        'referent_columns': referent_columns_id
    }
    response = client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)
    assert response.status_code == 201
    _verify_foreign_key_constraint(response.json(), referrer_columns_id, 'Patents_Center_fkey', referent_columns_id)


def test_drop_constraint(create_table, client):
    table_name = 'NASA Constraint List 7'
    table = create_table(table_name)

    constraint_column = _get_columns_by_name(table, ['Case Number'])[0]
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


def test_create_unique_constraint_with_duplicate_name(create_table, client):
    table_name = 'NASA Constraint List 8'
    table = create_table(table_name)
    constraint_columns = _get_columns_by_name(table, ['Center', 'Case Number'])
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


def test_create_unique_constraint_for_non_unique_column(create_table, client):
    table_name = 'NASA Constraint List 9'
    table = create_table(table_name)
    constraint_column = _get_columns_by_name(table, ['Center'])[0]
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


def test_drop_nonexistent_constraint(create_table, client):
    table_name = 'NASA Constraint List 10'
    table = create_table(table_name)

    response = client.delete(f'/api/db/v0/tables/{table.id}/constraints/345/')
    assert response.status_code == 404
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value


def test_drop_nonexistent_table(create_table, client):
    response = client.delete('/api/db/v0/tables/9387489/constraints/4234/')
    assert response.status_code == 404
    response_data = response.json()[0]
    assert response_data['message'] == "Not found."
    assert response_data['code'] == ErrorCodes.NotFound.value
