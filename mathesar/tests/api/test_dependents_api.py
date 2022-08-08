from db.constraints.base import UniqueConstraint


def test_dependents_response_attrs(two_foreign_key_tables, client):
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
    client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)

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
    client.post(f'/api/db/v0/tables/{referrer_table.id}/constraints/', data)

    response = client.get(f'/api/db/v0/tables/{referent_table.id}/dependents/')
    response_data = response.json()

    referrer_table_constraints_results = client.get(f'/api/db/v0/tables/{referrer_table.id}/constraints/').json()['results']
    referent_table_constraints_results = client.get(f'/api/db/v0/tables/{referent_table.id}/constraints/').json()['results']

    referent_constraint_ids = [r['id'] for r in referent_table_constraints_results]
    referer_constraint_ids = [r['id'] for r in referrer_table_constraints_results]
    referer_foreign_key_constraint_id = [r['id'] for r in referrer_table_constraints_results if r['type'] == 'foreignkey']

    referent_expected_dependent_ids = referent_constraint_ids + referer_foreign_key_constraint_id + [referrer_table.id]
    referent_actual_dependents_ids = [int(d['obj']['id']) for d in response_data if d['parent_obj']['objid'] == referent_table.oid]

    referrer_dependents_ids = [int(d['obj']['id']) for d in response_data if d['parent_obj']['objid'] == referrer_table.oid]

    assert sorted(referent_expected_dependent_ids) == sorted(referent_actual_dependents_ids)
    assert sorted(referer_constraint_ids) == sorted(referrer_dependents_ids)
