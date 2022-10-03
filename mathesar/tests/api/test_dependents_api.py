import pytest


def _get_object_dependent_ids(dependents, object_id, type):
    return [
        int(d['obj']['id'])
        for d in dependents if int(d['parent_obj']['id']) == object_id and d['parent_obj']['type'] == type
    ]


def _get_constraint_ids(table_constraint_results):
    return [r['id'] for r in table_constraint_results]


@pytest.fixture
def library_ma_tables(db_table_to_dj_table, library_db_tables):
    return {
        table_name: db_table_to_dj_table(db_table)
        for table_name, db_table
        in library_db_tables.items()
    }


def test_dependents_response_attrs(library_ma_tables, client):
    items_id = library_ma_tables["Items"].id
    response = client.get(f'/api/db/v0/tables/{items_id}/dependents/')
    response_data = response.json()

    dependent_expected_attrs = ['obj', 'parent_obj']
    assert len(response_data) == 7
    assert all(
        [
            all(attr in dependent for attr in dependent_expected_attrs)
            for dependent in response_data
        ]
    )
    assert all(
        [
            dependent is not None
            for dependent in response_data
        ]
    )


def test_dependents_response(library_ma_tables, client):
    items_id = library_ma_tables["Items"].id
    checkouts_id = library_ma_tables["Checkouts"].id

    items_dependents = client.get(f'/api/db/v0/tables/{items_id}/dependents/').json()
    items_dependent_ids = _get_object_dependent_ids(items_dependents, items_id, 'table')

    items_constraints = client.get(f'/api/db/v0/tables/{items_id}/constraints/').json()['results']
    checkouts_constraints = client.get(f'/api/db/v0/tables/{checkouts_id}/constraints/').json()['results']

    items_constraints_ids = _get_constraint_ids(items_constraints)
    checkouts_items_fkey_id = [c['id'] for c in checkouts_constraints if "Item" in c['name']]

    assert sorted(items_dependent_ids) == sorted(items_constraints_ids + [checkouts_id] + checkouts_items_fkey_id)


def test_schema_dependents(library_ma_tables, client):
    table_names = ['Authors', 'Checkouts', 'Items', 'Patrons', 'Publications', 'Publishers']
    table_ids = [library_ma_tables[name].id for name in table_names]

    schema_id = library_ma_tables['Authors'].schema.id
    schema_dependents_graph = client.get(f'/api/db/v0/schemas/{schema_id}/dependents/').json()

    schema_dependents_ids = _get_object_dependent_ids(schema_dependents_graph, schema_id, 'schema')

    assert sorted(table_ids) == sorted(schema_dependents_ids)


def test_column_dependents(library_ma_tables, client):
    patrons = library_ma_tables['Patrons']
    patronds_id_col = patrons.get_column_by_name('id')

    patrons_id_dependents_graph = client.get(f'/api/db/v0/tables/{patrons.id}/columns/{patronds_id_col.id}/dependents/').json()
    patrons_id_dependents_ids = _get_object_dependent_ids(patrons_id_dependents_graph, patrons.id, 'table column')

    checkouts = library_ma_tables['Checkouts']
    patrons_constraints = client.get(f'/api/db/v0/tables/{patrons.id}/constraints/').json()['results']
    checkouts_constraints = client.get(f'/api/db/v0/tables/{checkouts.id}/constraints/').json()['results']

    patrons_pk_id = [c['id'] for c in patrons_constraints if c['name'] == 'Patrons_pkey']
    checkouts_patrons_fk_id = [c['id'] for c in checkouts_constraints if c['name'] == 'Checkouts_Patron id_fkey']

    assert sorted(patrons_id_dependents_ids) == sorted([checkouts.id] + patrons_pk_id + checkouts_patrons_fk_id)


def test_dependents_filters(library_ma_tables, client):
    publishers_id = library_ma_tables['Publishers'].id
    exclude_types = ['table constraint']
    query_params = {'exclude': exclude_types}
    publishers_dependents_graph = client.get(f'/api/db/v0/tables/{publishers_id}/dependents/', data=query_params).json()

    dependents_types = [dependent['obj']['type'] for dependent in publishers_dependents_graph]

    assert all(
        [
            type not in dependents_types for type in exclude_types
        ]
    )
