import json
from unittest.mock import patch

import pytest
from db import records
from db.records import BadGroupFormat, GroupFieldNotFound
from sqlalchemy_filters.exceptions import (BadFilterFormat, BadSortFormat,
                                           FilterFieldNotFound,
                                           SortFieldNotFound)


def test_record_list(create_table, client):
    """
    Desired format:
    {
        "count": 25,
        "results": [
            {
                "mathesar_id": 1,
                "Center": "NASA Kennedy Space Center",
                "Status": "Application",
                "Case Number": "KSC-12871",
                "Patent Number": "0",
                "Application SN": "13/033,085",
                "Title": "Polyimide Wire Insulation Repair System",
                "Patent Expiration Date": ""
            },
            {
                "mathesar_id": 2,
                "Center": "NASA Ames Research Center",
                "Status": "Issued",
                "Case Number": "ARC-14048-1",
                "Patent Number": "5694939",
                "Application SN": "08/543,093",
                "Title": "Autogenic-Feedback Training Exercise Method & System",
                "Patent Expiration Date": "10/03/2015"
            },
            etc.
        ]
    }
    """
    table_name = 'NASA Record List'
    table = create_table(table_name)

    response = client.get(f'/api/v0/tables/{table.id}/records/')
    response_data = response.json()
    record_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1393
    assert len(response_data['results']) == 50
    for column_name in table.sa_column_names:
        assert column_name in record_data


def test_record_list_filter(create_table, client):
    table_name = 'NASA Record List Filter'
    table = create_table(table_name)

    filter_list = [
        {'or': [
            {'and': [
                {'field': 'Center', 'op': '==', 'value': 'NASA Ames Research Center'},
                {'field': 'Case Number', 'op': '==', 'value': 'ARC-14048-1'}
            ]},
            {'and': [
                {'field': 'Center', 'op': '==', 'value': 'NASA Kennedy Space Center'},
                {'field': 'Case Number', 'op': '==', 'value': 'KSC-12871'}
            ]}
        ]}
    ]
    json_filter_list = json.dumps(filter_list)

    with patch.object(
        records, "get_records", side_effect=records.get_records
    ) as mock_get:
        response = client.get(
            f'/api/v0/tables/{table.id}/records/?filters={json_filter_list}'
        )
        response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 2
    assert len(response_data['results']) == 2
    assert mock_get.call_args is not None
    assert mock_get.call_args[1]['filters'] == filter_list


def test_record_list_filter_duplicates(create_table, client):
    table_name = 'NASA Record List Filter Duplicates'
    table = create_table(table_name)

    filter_list = [
        {'field': '', 'op': 'get_duplicates', 'value': ['Patent Expiration Date']}
    ]
    json_filter_list = json.dumps(filter_list)

    with patch.object(records, "get_records") as mock_get:
        client.get(f'/api/v0/tables/{table.id}/records/?filters={json_filter_list}')
    assert mock_get.call_args is not None
    assert mock_get.call_args[1]['filters'] == filter_list


def _test_filter_with_added_columns(table, client, columns_to_add, operators_and_expected_values):

    for new_column in columns_to_add:
        new_column_name = new_column.get("name")
        new_column_type = new_column.get("type")
        table.add_column({"name": new_column_name, "type": new_column_type})
        row_values_list = []

        response_data = client.get(f'/api/v0/tables/{table.id}/records/').json()
        existing_records = response_data['results']

        for row_number, row in enumerate(existing_records, 1):
            row_value = new_column.get("row_values").get(row_number, new_column.get("default_value"))
            row_values_list.append({new_column_name: row_value})

        table.create_record_or_records(row_values_list)

        for op, value, expected in operators_and_expected_values:
            filter_list = [{'field': new_column_name, 'op': op, 'value': value}]
            json_filter_list = json.dumps(filter_list)

            with patch.object(
                records, "get_records", side_effect=records.get_records
            ) as mock_get:
                response = client.get(
                    f'/api/v0/tables/{table.id}/records/?filters={json_filter_list}'
                )
                response_data = response.json()

            num_results = expected
            if expected > 50:
                num_results = 50
            assert response.status_code == 200
            assert response_data['count'] == expected
            assert len(response_data['results']) == num_results
            assert mock_get.call_args is not None
            assert mock_get.call_args[1]['filters'] == filter_list


def test_record_list_filter_for_boolean_type(create_table, client):
    table_name = 'NASA Record List Filter'
    table = create_table(table_name)

    columns_to_add = [
        {
            'name': 'Published',
            'type': 'BOOLEAN',
            'default_value': True,
            'row_values': {1: False, 2: False, 3: None}
        }
    ]

    op_value_and_expected = [
        ('ne', True, 2),
        ('eq', False, 2),
        ('is_null', None, 1394),
        ('is_not_null', None, 49)
    ]

    _test_filter_with_added_columns(table, client, columns_to_add, op_value_and_expected)


def test_record_list_sort(create_table, client):
    table_name = 'NASA Record List Order'
    table = create_table(table_name)

    order_by = [
        {'field': 'Center', 'direction': 'desc'},
        {'field': 'Case Number', 'direction': 'asc'},
    ]
    json_order_by = json.dumps(order_by)

    with patch.object(
        records, "get_records", side_effect=records.get_records
    ) as mock_get:
        response = client.get(
            f'/api/v0/tables/{table.id}/records/?order_by={json_order_by}'
        )
        response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1393
    assert len(response_data['results']) == 50

    assert mock_get.call_args is not None
    assert mock_get.call_args[1]['order_by'] == order_by


def _test_record_list_group(table, client, group_count_by, expected_groups):
    order_by = [
        {'field': 'Center', 'direction': 'desc'},
        {'field': 'Case Number', 'direction': 'asc'},
    ]
    json_order_by = json.dumps(order_by)
    json_group_count_by = json.dumps(group_count_by)
    query_str = f'group_count_by={json_group_count_by}&order_by={json_order_by}'

    with patch.object(
        records, "get_group_counts", side_effect=records.get_group_counts
    ) as mock_get:
        response = client.get(f'/api/v0/tables/{table.id}/records/?{query_str}')
        response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1393
    assert len(response_data['results']) == 50

    assert 'group_count' in response_data
    assert response_data['group_count']['group_count_by'] == group_count_by
    assert 'results' in response_data['group_count']
    assert 'values' in response_data['group_count']['results'][0]
    assert 'count' in response_data['group_count']['results'][0]

    results = response_data['group_count']['results']
    returned_groups = {tuple(group['values']) for group in results}
    for expected_group in expected_groups:
        assert expected_group in returned_groups

    assert mock_get.call_args is not None
    assert mock_get.call_args[0][2] == group_count_by


def test_record_list_group_single_column(create_table, client):
    table_name = 'NASA Record List Group Single'
    table = create_table(table_name)
    group_count_by = ['Center']
    expected_groups = [
        ('NASA Marshall Space Flight Center',),
        ('NASA Stennis Space Center',)
    ]
    _test_record_list_group(table, client, group_count_by, expected_groups)


def test_record_list_group_multi_column(create_table, client):
    table_name = 'NASA Record List Group Multi'
    table = create_table(table_name)
    group_count_by = ['Center', 'Status']
    expected_groups = [
        ('NASA Marshall Space Flight Center', 'Issued'),
        ('NASA Stennis Space Center', 'Issued'),
    ]
    _test_record_list_group(table, client, group_count_by, expected_groups)


def test_record_list_pagination_limit(create_table, client):
    table_name = 'NASA Record List Pagination Limit'
    table = create_table(table_name)

    response = client.get(f'/api/v0/tables/{table.id}/records/?limit=5')
    response_data = response.json()
    record_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1393
    assert len(response_data['results']) == 5
    for column_name in table.sa_column_names:
        assert column_name in record_data


def test_record_list_pagination_offset(create_table, client):
    table_name = 'NASA Record List Pagination Offset'
    table = create_table(table_name)

    response_1 = client.get(f'/api/v0/tables/{table.id}/records/?limit=5&offset=5')
    response_1_data = response_1.json()
    record_1_data = response_1_data['results'][0]
    response_2 = client.get(f'/api/v0/tables/{table.id}/records/?limit=5&offset=10')
    response_2_data = response_2.json()
    record_2_data = response_2_data['results'][0]

    assert response_1.status_code == 200
    assert response_2.status_code == 200
    assert response_1_data['count'] == 1393
    assert response_2_data['count'] == 1393
    assert len(response_1_data['results']) == 5
    assert len(response_2_data['results']) == 5

    assert record_1_data['mathesar_id'] != record_2_data['mathesar_id']
    assert record_1_data['Case Number'] != record_2_data['Case Number']
    assert record_1_data['Patent Number'] != record_2_data['Patent Number']
    assert record_1_data['Application SN'] != record_2_data['Application SN']


def test_record_detail(create_table, client):
    table_name = 'NASA Record Detail'
    table = create_table(table_name)
    record_id = 1
    record = table.get_record(record_id)

    response = client.get(f'/api/v0/tables/{table.id}/records/{record_id}/')
    record_data = response.json()
    record_as_dict = record._asdict()

    assert response.status_code == 200
    for column_name in table.sa_column_names:
        assert column_name in record_data
        assert record_as_dict[column_name] == record_data[column_name]


def test_record_create(create_table, client):
    table_name = 'NASA Record Create'
    table = create_table(table_name)
    records = table.get_records()
    original_num_records = len(records)

    data = {
        'Center': 'NASA Example Space Center',
        'Status': 'Application',
        'Case Number': 'ESC-0000',
        'Patent Number': '01234',
        'Application SN': '01/000,001',
        'Title': 'Example Patent Name',
        'Patent Expiration Date': ''
    }
    response = client.post(f'/api/v0/tables/{table.id}/records/', data=data)
    record_data = response.json()

    assert response.status_code == 201
    assert len(table.get_records()) == original_num_records + 1
    for column_name in table.sa_column_names:
        assert column_name in record_data
        if column_name in data:
            assert data[column_name] == record_data[column_name]


def test_record_partial_update(create_table, client):
    table_name = 'NASA Record Patch'
    table = create_table(table_name)
    records = table.get_records()
    record_id = records[0]['mathesar_id']

    original_response = client.get(f'/api/v0/tables/{table.id}/records/{record_id}/')
    original_data = original_response.json()

    data = {
        'Center': 'NASA Example Space Center',
        'Status': 'Example',
    }
    response = client.patch(f'/api/v0/tables/{table.id}/records/{record_id}/', data=data)
    record_data = response.json()

    assert response.status_code == 200
    for column_name in table.sa_column_names:
        assert column_name in record_data
        if column_name in data and column_name not in ['Center', 'Status']:
            assert original_data[column_name] == record_data[column_name]
        elif column_name == 'Center':
            assert original_data[column_name] != record_data[column_name]
            assert record_data[column_name] == 'NASA Example Space Center'
        elif column_name == 'Status':
            assert original_data[column_name] != record_data[column_name]
            assert record_data[column_name] == 'Example'


def test_record_delete(create_table, client):
    table_name = 'NASA Record Delete'
    table = create_table(table_name)
    records = table.get_records()
    original_num_records = len(records)
    record_id = records[0]['mathesar_id']

    response = client.delete(f'/api/v0/tables/{table.id}/records/{record_id}/')
    assert response.status_code == 204
    assert len(table.get_records()) == original_num_records - 1


def test_record_update(create_table, client):
    table_name = 'NASA Record Put'
    table = create_table(table_name)
    records = table.get_records()
    record_id = records[0]['mathesar_id']

    data = {
        'Center': 'NASA Example Space Center',
        'Status': 'Example',
    }
    response = client.put(f'/api/v0/tables/{table.id}/records/{record_id}/', data=data)
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PUT" not allowed.'


def test_record_404(create_table, client):
    table_name = 'NASA Record 404'
    table = create_table(table_name)
    records = table.get_records()
    record_id = records[0]['mathesar_id']

    client.delete(f'/api/v0/tables/{table.id}/records/{record_id}/')
    response = client.get(f'/api/v0/tables/{table.id}/records/{record_id}/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'


@pytest.mark.parametrize("exception", [BadFilterFormat, FilterFieldNotFound])
def test_record_list_filter_exceptions(create_table, client, exception):
    table_name = f"NASA Record List {exception.__name__}"
    table = create_table(table_name)
    filter_list = json.dumps([{"field": "Center", "op": "is_null"}])
    with patch.object(records, "get_records", side_effect=exception):
        response = client.get(
            f'/api/v0/tables/{table.id}/records/?filters={filter_list}'
        )
        response_data = response.json()
    assert response.status_code == 400
    assert len(response_data) == 1
    assert "filters" in response_data


@pytest.mark.parametrize("exception", [BadSortFormat, SortFieldNotFound])
def test_record_list_sort_exceptions(create_table, client, exception):
    table_name = f"NASA Record List {exception.__name__}"
    table = create_table(table_name)
    order_by = json.dumps([{"field": "Center", "direction": "desc"}])
    with patch.object(records, "get_records", side_effect=exception):
        response = client.get(
            f'/api/v0/tables/{table.id}/records/?order_by={order_by}'
        )
        response_data = response.json()
    assert response.status_code == 400
    assert len(response_data) == 1
    assert "order_by" in response_data


@pytest.mark.parametrize("exception", [BadGroupFormat, GroupFieldNotFound])
def test_record_list_group_exceptions(create_table, client, exception):
    table_name = f"NASA Record List {exception.__name__}"
    table = create_table(table_name)
    group_by = json.dumps(["Center"])
    with patch.object(records, "get_group_counts", side_effect=exception):
        response = client.get(
            f'/api/v0/tables/{table.id}/records/?group_count_by={group_by}'
        )
        response_data = response.json()
    assert response.status_code == 400
    assert len(response_data) == 1
    assert "group_count_by" in response_data
