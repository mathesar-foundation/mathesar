import pytest


def _get_object_dependent_ids(dependents, object_id, type):
    return [
        int(d['obj']['id'])
        for d in dependents if int(d['parent_obj']['id']) == object_id and d['parent_obj']['type'] == type
    ]


def _get_constraint_ids(table_constraint_results):
    return [r['id'] for r in table_constraint_results]


def test_dependents_response_attrs(library_ma_tables, client):
    items_id = library_ma_tables["Items"].id
    response = client.get(f'/api/db/v0/tables/{items_id}/dependents/')
    assert response.status_code == 200
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


import logging
logger = logging.getLogger(__name__)
def test_dependents_response(library_ma_tables, client):
    from mathesar.state import reset_reflection; reset_reflection()
    items_id = library_ma_tables["Items"].id
    checkouts_id = library_ma_tables["Checkouts"].id

    logger.debug("client.get(f'/api/db/v0/tables/{items_id}/dependents/')")
    items_dependents = client.get(f'/api/db/v0/tables/{items_id}/dependents/').json()
    items_dependent_ids = _get_object_dependent_ids(items_dependents, items_id, 'table')

    logger.debug("client.get(f'/api/db/v0/tables/{items_id}/constraints/')")
    items_constraints = client.get(f'/api/db/v0/tables/{items_id}/constraints/').json()['results']
    logger.debug("client.get(f'/api/db/v0/tables/{checkouts_id}/constraints/')")
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
