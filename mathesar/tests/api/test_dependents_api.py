import pytest


def _get_object_dependent_ids(dependents, object_id):
    return [int(d['obj']['id']) for d in dependents if int(d['parent_obj']['id']) == object_id]


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
    response = client.get(f'/api/db/v0/tables/{library_ma_tables["Items"].id}/dependents/')
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
    items_dependent_ids = _get_object_dependent_ids(items_dependents, items_id)

    items_constraints = client.get(f'/api/db/v0/tables/{items_id}/constraints/').json()['results']
    checkouts_constraints = client.get(f'/api/db/v0/tables/{checkouts_id}/constraints/').json()['results']

    items_constraints_ids = _get_constraint_ids(items_constraints)
    checkouts_items_fkey_id = [c['id'] for c in checkouts_constraints if "Item" in c['name']]

    assert sorted(items_dependent_ids) == sorted(items_constraints_ids + [checkouts_id] + checkouts_items_fkey_id)
