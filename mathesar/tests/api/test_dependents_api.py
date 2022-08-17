def _get_object_dependent_ids(response_data, object_oid):
    return [int(d['obj']['id']) for d in response_data if d['parent_obj']['objid'] == object_oid]


def _get_constraint_ids(table_constraint_results):
    return [r['id'] for r in table_constraint_results]


def test_dependents_response_attrs(two_foreign_key_tables, client):
    _, referent_table = two_foreign_key_tables

    response = client.get(f'/api/db/v0/tables/{referent_table.id}/dependents/')
    response_data = response.json()

    dependent_expected_attrs = ['obj', 'parent_obj']
    assert len(response_data) == 6
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


def test_dependents_response(two_foreign_key_tables, client):
    referrer_table, referent_table = two_foreign_key_tables

    response = client.get(f'/api/db/v0/tables/{referent_table.id}/dependents/')
    response_data = response.json()

    referrer_table_constraints_results = client.get(f'/api/db/v0/tables/{referrer_table.id}/constraints/').json()['results']
    referent_table_constrints_results = client.get(f'/api/db/v0/tables/{referent_table.id}/constraints/').json()['results']

    referer_constraint_ids = _get_constraint_ids(referrer_table_constraints_results)
    referent_constraint_ids = _get_constraint_ids(referent_table_constrints_results)
    referer_foreign_key_constraint_id = list(filter(lambda x: x['type'] == 'foreignkey', referrer_table_constraints_results))[0]['id']

    referent_expected_dependent_ids = referent_constraint_ids + [referer_foreign_key_constraint_id] + [referrer_table.id]

    referent_actual_dependents_ids = _get_object_dependent_ids(response_data, referent_table.oid)
    referrer_dependents_ids = _get_object_dependent_ids(response_data, referrer_table.oid)

    assert sorted(referent_expected_dependent_ids) == sorted(referent_actual_dependents_ids)
    assert sorted(referer_constraint_ids) == sorted(referrer_dependents_ids)
