import json
import pytest
from copy import deepcopy
from unittest.mock import patch

from sqlalchemy_filters.exceptions import BadSortFormat, SortFieldNotFound

from db.functions.exceptions import UnknownDBFunctionID
from db.records.exceptions import BadGroupFormat, GroupFieldNotFound
from db.records.operations.group import GroupBy
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.api.utils import follows_json_number_spec
from mathesar.functions.operations.convert import rewrite_db_function_spec_column_ids_to_names
from mathesar.models import base as models_base
from mathesar.models.query import DBQuery
from mathesar.utils.preview import compute_path_prefix, compute_path_str


def test_record_list(create_patents_table, client):
    """
    Desired format:
    {
        "count": 25,
        "results": [
            {
                "id": 1,
                "Center": "NASA Kennedy Space Center",
                "Status": "Application",
                "Case Number": "KSC-12871",
                "Patent Number": "0",
                "Application SN": "13/033,085",
                "Title": "Polyimide Wire Insulation Repair System",
                "Patent Expiration Date": ""
            },
            {
                "id": 2,
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
    table = create_patents_table(table_name)

    response = client.get(f'/api/db/v0/tables/{table.id}/records/')
    assert response.status_code == 200

    response_data = response.json()
    record_data = response_data['results'][0]
    assert response_data['count'] == 1393
    assert response_data['grouping'] is None
    assert len(response_data['results']) == 50
    for column_id in table.columns.all().values_list('id', flat=True):
        assert str(column_id) in record_data


serialization_test_list = [
    ("TIME WITH TIME ZONE", "12:30:10.0+01:00"),
    ("TIMESTAMP WITHOUT TIME ZONE", "2000-05-23T12:30:10.0 AD"),
    ("MONEY", "$5.00"),
]


@pytest.mark.parametrize("type_, value", serialization_test_list)
def test_record_serialization(empty_nasa_table, create_column, client, type_, value):
    col_name = "TEST COL"
    column = create_column(empty_nasa_table, {"name": col_name, "type": type_})
    empty_nasa_table.create_record_or_records([{col_name: value}])

    response = client.get(f'/api/db/v0/tables/{empty_nasa_table.id}/records/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data["results"][0][str(column.id)] == value


def test_record_list_filter(create_patents_table, client):
    table_name = 'NASA Record List Filter'
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()

    filter = {"or": [
        {"and": [
            {"equal": [
                {"column_id": [columns_name_id_map['Center']]},
                {"literal": ["NASA Ames Research Center"]}
            ]},
            {"equal": [
                {"column_id": [columns_name_id_map["Case Number"]]},
                {"literal": ["ARC-14048-1"]}
            ]},
        ]},
        {"and": [
            {"equal": [
                {"column_id": [columns_name_id_map["Center"]]},
                {"literal": ["NASA Kennedy Space Center"]}
            ]},
            {"equal": [
                {"column_id": [columns_name_id_map["Case Number"]]},
                {"literal": ["KSC-12871"]}
            ]},
        ]},
    ]}
    json_filter = json.dumps(filter)

    with patch.object(
        DBQuery, "get_records", side_effect=DBQuery.get_records, autospec=True
    ) as mock_get:
        response = client.get(
            f'/api/db/v0/tables/{table.id}/records/?filter={json_filter}'
        )

    assert response.status_code == 200
    response_data = response.json()
    assert response_data['count'] == 2
    assert len(response_data['results']) == 2
    assert mock_get.call_args is not None
    column_ids_to_names = table.get_column_name_id_bidirectional_map().inverse
    processed_filter = rewrite_db_function_spec_column_ids_to_names(
        column_ids_to_names=column_ids_to_names,
        spec=filter,
    )
    assert mock_get.call_args[1]['filter'] == processed_filter


def test_record_list_duplicate_rows_only(create_patents_table, client):
    table_name = 'NASA Record List Filter Duplicates'
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    duplicate_only = columns_name_id_map['Patent Expiration Date']
    json_duplicate_only = json.dumps(duplicate_only)

    with patch.object(DBQuery, "get_records", return_value=[]) as mock_get:
        client.get(f'/api/db/v0/tables/{table.id}/records/?duplicate_only={json_duplicate_only}')
    assert mock_get.call_args is not None
    assert mock_get.call_args[1]['duplicate_only'] == duplicate_only


def test_filter_with_added_columns(create_patents_table, client):
    table_name = 'NASA Record List Filter'
    table = create_patents_table(table_name)

    columns_to_add = [
        {
            'name': 'Published',
            'type': 'BOOLEAN',
            'default_value': True,
            'row_values': {1: False, 2: False, 3: None}
        }
    ]

    operators_and_expected_values = [
        (
            lambda new_column_id, value: {"not": [{"equal": [{"column_id": [new_column_id]}, {"literal": [value]}]}]},
            True, 2),
        (
            lambda new_column_id, value: {"equal": [{"column_id": [new_column_id]}, {"literal": [value]}]},
            False, 2),
        (
            lambda new_column_id, _: {"empty": [{"column_id": [new_column_id]}]},
            None, 1394),
        (
            lambda new_column_id, _: {"not": [{"empty": [{"column_id": [new_column_id]}]}]},
            None, 49),
    ]

    for new_column in columns_to_add:
        new_column_name = new_column.get("name")
        new_column_type = new_column.get("type")
        table.add_column({"name": new_column_name, "type": new_column_type})
        row_values_list = []
        # Get a new instance with clean cache, so that the new column is added to the _sa_column list
        table = models_base.Table.objects.get(oid=table.oid)
        response_data = client.get(f'/api/db/v0/tables/{table.id}/records/').json()
        existing_records = response_data['results']

        for row_number, row in enumerate(existing_records, 1):
            row_value = new_column.get("row_values").get(row_number, new_column.get("default_value"))
            row_values_list.append({new_column_name: row_value})

        table.create_record_or_records(row_values_list)

        column_names_to_ids = table.get_column_name_id_bidirectional_map()
        new_column_id = column_names_to_ids[new_column_name]

        for filter_lambda, value, expected in operators_and_expected_values:
            filter = filter_lambda(new_column_id, value)
            json_filter = json.dumps(filter)

            with patch.object(
                DBQuery, "get_records", side_effect=DBQuery.get_records, autospec=True
            ) as mock_get:
                response = client.get(
                    f'/api/db/v0/tables/{table.id}/records/?filter={json_filter}'
                )
                response_data = response.json()

            num_results = expected
            if expected > 50:
                num_results = 50
            assert response.status_code == 200
            assert response_data['count'] == expected
            assert len(response_data['results']) == num_results
            assert mock_get.call_args is not None
            processed_filter = rewrite_db_function_spec_column_ids_to_names(
                column_ids_to_names=column_names_to_ids.inverse,
                spec=filter,
            )
            assert mock_get.call_args[1]['filter'] == processed_filter


def test_record_list_sort(create_patents_table, client):
    table_name = 'NASA Record List Order'
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    order_by = [
        {'field': 'Center', 'direction': 'desc'},
        {'field': 'Case Number', 'direction': 'asc'},
    ]

    id_converted_order_by = [{**column, 'field': columns_name_id_map[column['field']]} for column in order_by]
    json_order_by = json.dumps(id_converted_order_by)

    with patch.object(
        DBQuery, "get_records", side_effect=DBQuery.get_records, autospec=True
    ) as mock_get:
        response = client.get(
            f'/api/db/v0/tables/{table.id}/records/?order_by={json_order_by}'
        )
        response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1393
    assert len(response_data['results']) == 50

    assert mock_get.call_args is not None
    assert mock_get.call_args[1]['order_by'] == order_by


def test_record_search(create_patents_table, client):
    table_name = 'NASA Record List Search'
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    search_columns = [
        {'field': columns_name_id_map['Title'], 'literal': 'A Direct-To Controller Tool'},
    ]

    json_search_fuzzy = json.dumps(search_columns)

    response = client.get(
        f'/api/db/v0/tables/{table.id}/records/?search_fuzzy={json_search_fuzzy}'
    )
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1


grouping_params = [
    (
        'NASA Record List Group Single',
        {'columns': ['Center']},
        [
            {
                'count': 87,
                'first_value': {'Center': 'NASA Kennedy Space Center'},
                'last_value': {'Center': 'NASA Kennedy Space Center'},
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [0]
            }, {
                'count': 138,
                'first_value': {'Center': 'NASA Ames Research Center'},
                'last_value': {'Center': 'NASA Ames Research Center'},
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33,
                    34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
                    64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
                    79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93,
                    94, 95, 96, 97, 98, 99,
                ]
            }, {
                'count': 21,
                'first_value': {'Center': 'NASA Armstrong Flight Research Center'},
                'last_value': {'Center': 'NASA Armstrong Flight Research Center'},
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [30]
            },
        ],
    ),
    (
        'NASA Record List Group Single Percentile',
        {'columns': ['Center'], 'mode': 'percentile', 'num_groups': 5},
        [
            {
                'count': 87,
                'first_value': {'Center': 'NASA Kennedy Space Center'},
                'last_value': {'Center': 'NASA Kennedy Space Center'},
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [0]
            }, {
                'count': 159,
                'first_value': {'Center': 'NASA Ames Research Center'},
                'last_value': {'Center': 'NASA Armstrong Flight Research Center'},
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
                    33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
                    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
                    63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
                    78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92,
                    93, 94, 95, 96, 97, 98, 99
                ],
            },
        ],
    ),
    (
        'NASA Record List Group Multi',
        {'columns': ['Center', 'Status']},
        [
            {
                'count': 29,
                'first_value': {
                    'Center': 'NASA Kennedy Space Center', 'Status': 'Application'
                },
                'last_value': {
                    'Center': 'NASA Kennedy Space Center', 'Status': 'Application'
                },
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [0]
            }, {
                'count': 100,
                'first_value': {
                    'Center': 'NASA Ames Research Center', 'Status': 'Issued'
                },
                'last_value': {
                    'Center': 'NASA Ames Research Center', 'Status': 'Issued'
                },
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33,
                    34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
                    64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
                    79, 80, 81, 82, 83, 84, 85, 88, 90, 91, 92, 94, 96, 98, 99
                ]
            }, {
                'count': 12,
                'first_value': {
                    'Center': 'NASA Armstrong Flight Research Center', 'Status': 'Issued'
                },
                'last_value': {
                    'Center': 'NASA Armstrong Flight Research Center', 'Status': 'Issued'
                },
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [30]
            }, {
                'count': 38,
                'first_value': {
                    'Center': 'NASA Ames Research Center', 'Status': 'Application'
                },
                'last_value': {
                    'Center': 'NASA Ames Research Center', 'Status': 'Application'
                },
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [86, 87, 89, 93, 95, 97]
            },
        ],
    ),
    (
        'NASA Record List Group Multi Percentile',
        {'columns': ['Center', 'Status'], 'mode': 'percentile', 'num_groups': 5},
        [
            {
                'count': 197,
                'first_value': {
                    'Center': 'NASA Kennedy Space Center', 'Status': 'Application'
                },
                'last_value': {
                    'Center': 'NASA Langley Research Center', 'Status': 'Application'
                },
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [0]
            }, {
                'count': 159,
                'first_value': {
                    'Center': 'NASA Ames Research Center', 'Status': 'Application'
                },
                'last_value': {
                    'Center': 'NASA Armstrong Flight Research Center', 'Status': 'Issued'
                },
                'less_than_eq_value': None,
                'less_than_value': None,
                'greater_than_eq_value': None,
                'greater_than_value': None,
                'result_indices': [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
                    33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
                    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
                    63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
                    78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92,
                    93, 94, 95, 96, 97, 98, 99
                ],
            },
        ],
    ),
    (
        'Magnitude Grouping',
        {'columns': ['id'], 'mode': 'magnitude'},
        [
            {
                'count': 99,
                'first_value': {'id': 1},
                'last_value': {'id': 99},
                'less_than_eq_value': None,
                'greater_than_eq_value': {'id': 0},
                'less_than_value': {'id': 100},
                'greater_than_value': None,
                'result_indices': [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                    17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
                    32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
                    47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
                    62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
                    77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
                    89, 90, 91, 92, 93, 94, 95, 96, 97, 98
                ],
            }, {
                'count': 100,
                'first_value': {'id': 100},
                'last_value': {'id': 199},
                'less_than_eq_value': None,
                'greater_than_eq_value': {'id': 100},
                'less_than_value': {'id': 200},
                'greater_than_value': None,
                'result_indices': [99],
            },
        ],
    ),
    (
        'Count By Grouping',
        {
            'columns': ['id'],
            'mode': 'count_by',
            'global_min': 0,
            'global_max': 1000,
            'count_by': 50
        },
        [
            {
                'count': 49,
                'first_value': {'id': 1},
                'last_value': {'id': 49},
                'less_than_eq_value': None,
                'greater_than_eq_value': {'id': 0},
                'less_than_value': {'id': 50},
                'greater_than_value': None,
                'result_indices': [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                    17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
                    32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
                    47, 48
                ]
            }, {
                'count': 50,
                'first_value': {'id': 50},
                'last_value': {'id': 99},
                'less_than_eq_value': None,
                'greater_than_eq_value': {'id': 50},
                'less_than_value': {'id': 100},
                'greater_than_value': None,
                'result_indices': [
                    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
                    64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
                    79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93,
                    94, 95, 96, 97, 98
                ]
            }, {
                'count': 50,
                'first_value': {'id': 100},
                'last_value': {'id': 149},
                'less_than_eq_value': None,
                'greater_than_eq_value': {'id': 100},
                'less_than_value': {'id': 150},
                'greater_than_value': None,
                'result_indices': [99]
            }
        ]
    ),
    (
        'NASA Record List Group Prefix',
        {'columns': ['Case Number'], 'mode': 'prefix', 'prefix_length': 3},
        [
            {
                'count': 87,
                'first_value': {'Case Number': 'KSC-11641'},
                'last_value': {'Case Number': 'KSC-13689'},
                'less_than_eq_value': None,
                'greater_than_eq_value': None,
                'less_than_value': None,
                'greater_than_value': None,
                'result_indices': [0]
            }, {
                'count': 138,
                'first_value': {'Case Number': 'ARC-14048-1'},
                'last_value': {'Case Number': 'ARC-16942-2'},
                'less_than_eq_value': None,
                'greater_than_eq_value': None,
                'less_than_value': None,
                'greater_than_value': None,
                'result_indices': [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33,
                    34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
                    64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
                    79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93,
                    94, 95, 96, 97, 98, 99
                ]
            }, {
                'count': 21,
                'first_value': {'Case Number': 'DRC-001-049'},
                'last_value': {'Case Number': 'DRC-098-001'},
                'less_than_eq_value': None,
                'greater_than_eq_value': None,
                'less_than_value': None,
                'greater_than_value': None,
                'result_indices': [30]
            },
        ],
    ),
]


def test_null_error_record_create(create_patents_table, client):
    table_name = 'NASA Record Create'
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    column_id = columns_name_id_map['Case Number']
    data = {"nullable": False}
    client.patch(
        f"/api/db/v0/tables/{table.id}/columns/{column_id}/", data=data
    )
    data = {
        columns_name_id_map['Center']: 'NASA Example Space Center',
        columns_name_id_map['Status']: 'Application',
        columns_name_id_map['Case Number']: None,
        columns_name_id_map['Patent Number']: '01234',
        columns_name_id_map['Application SN']: '01/000,001',
        columns_name_id_map['Title']: 'Example Patent Name',
        columns_name_id_map['Patent Expiration Date']: ''
    }
    response = client.post(f'/api/db/v0/tables/{table.id}/records/', data=data)
    record_data = response.json()
    assert response.status_code == 400
    assert 'null value in column "Case Number"' in record_data[0]['message']
    assert ErrorCodes.NotNullViolation.value == record_data[0]['code']
    assert column_id == record_data[0]['detail']['column_id']


@pytest.mark.parametrize('table_name,grouping,expected_groups', grouping_params)
def test_record_list_groups(
        table_name, grouping, expected_groups, create_patents_table, client,
):
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()

    order_by = [
        {'field': columns_name_id_map['id'], 'direction': 'asc'},
    ]
    json_order_by = json.dumps(order_by)
    group_by_columns_ids = [columns_name_id_map[column_name] for column_name in grouping['columns']]
    ids_converted_group_by = {**grouping, 'columns': group_by_columns_ids}
    json_grouping = json.dumps(ids_converted_group_by)
    limit = 100
    query_str = f'grouping={json_grouping}&order_by={json_order_by}&limit={limit}'

    response = client.get(f'/api/db/v0/tables/{table.id}/records/?{query_str}')
    response_data = response.json()

    def _test_group_equality(actual_groups, expect_groups):
        actual_groups = deepcopy(actual_groups)
        expect_groups = deepcopy(expect_groups)
        assert len(actual_groups) == len(expect_groups)
        for i in range(len(actual_groups)):
            assert actual_groups[i].pop('count') == expect_groups[i].pop('count')
            assert (
                actual_groups[i].pop('result_indices')
                == expect_groups[i].pop('result_indices')
            )
            for k in expect_groups[i]:
                actual_item = actual_groups[i][k]
                expect_item = expect_groups[i][k]
                if expect_item is not None:
                    for column_name in expect_item:
                        assert (
                            expect_item[column_name]
                            == actual_item[str(columns_name_id_map[column_name])]
                        )
                else:
                    assert actual_item is None

    def _retuple_bound_tuples(bound_tuple_list):
        if bound_tuple_list is not None:
            return [tuple(t) for t in grouping_dict['bound_tuples']]

    assert response.status_code == 200
    assert response_data['count'] == 1393
    assert len(response_data['results']) == limit

    group_by = GroupBy(**grouping)
    grouping_dict = response_data['grouping']
    assert grouping_dict['columns'] == [
        columns_name_id_map[colname] for colname in group_by.columns
    ]
    assert grouping_dict['mode'] == group_by.mode
    assert grouping_dict['num_groups'] == group_by.num_groups
    assert _retuple_bound_tuples(grouping_dict['bound_tuples']) == group_by.bound_tuples
    assert grouping_dict['count_by'] == group_by.count_by
    assert grouping_dict['global_min'] == group_by.global_min
    assert grouping_dict['global_max'] == group_by.global_max
    assert grouping_dict['preproc'] == group_by.preproc
    assert grouping_dict['prefix_length'] == group_by.prefix_length
    assert grouping_dict['extract_field'] == group_by.extract_field
    assert grouping_dict['ranged'] == group_by.ranged
    _test_group_equality(grouping_dict['groups'], expected_groups)


def test_group_filter_combo_order(create_patents_table, client):
    table_name = 'NASA Record List Group Filter'
    table = create_patents_table(table_name)
    name_id_map = table.get_column_name_id_bidirectional_map()

    raw_grouping = {'columns': ['Center']}
    raw_filter = {
        "contains": [
            {"column_id": [name_id_map["Case Number"]]}, {"literal": ["11"]}
        ]
    }
    raw_order_by = [{'field': name_id_map['id'], 'direction': 'asc'}]
    group_by_col_ids = [name_id_map[col_name] for col_name in raw_grouping['columns']]
    ids_converted_group_by = {**raw_grouping, 'columns': group_by_col_ids}

    grouping = json.dumps(ids_converted_group_by)
    filter_ = json.dumps(raw_filter)
    order_by = json.dumps(raw_order_by)

    limit = 10
    query_str = f'grouping={grouping}&order_by={order_by}&limit={limit}&filter={filter_}'

    response = client.get(f'/api/db/v0/tables/{table.id}/records/?{query_str}')
    response_data = response.json()

    expect_group_counts = [2, 3, 2, 1, 7]
    actual_group_counts = [g['count'] for g in response_data['grouping']['groups']]
    assert actual_group_counts == expect_group_counts


def test_record_list_pagination_limit(create_patents_table, client):
    table_name = 'NASA Record List Pagination Limit'
    table = create_patents_table(table_name)

    response = client.get(f'/api/db/v0/tables/{table.id}/records/?limit=5')
    response_data = response.json()
    record_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 1393
    assert len(response_data['results']) == 5
    for column_id in table.columns.all().values_list('id', flat=True):
        assert str(column_id) in record_data


def test_record_list_pagination_offset(create_patents_table, client):
    table_name = 'NASA Record List Pagination Offset'
    table = create_patents_table(table_name)
    columns_id = table.columns.all().order_by('id').values_list('id', flat=True)

    response_1 = client.get(f'/api/db/v0/tables/{table.id}/records/?limit=5&offset=5')
    response_1_data = response_1.json()
    record_1_data = response_1_data['results'][0]
    response_2 = client.get(f'/api/db/v0/tables/{table.id}/records/?limit=5&offset=10')
    response_2_data = response_2.json()
    record_2_data = response_2_data['results'][0]

    assert response_1.status_code == 200
    assert response_2.status_code == 200
    assert response_1_data['count'] == 1393
    assert response_2_data['count'] == 1393
    assert len(response_1_data['results']) == 5
    assert len(response_2_data['results']) == 5

    assert record_1_data[str(columns_id[0])] != record_2_data[str(columns_id[0])]
    assert record_1_data[str(columns_id[3])] != record_2_data[str(columns_id[3])]
    assert record_1_data[str(columns_id[4])] != record_2_data[str(columns_id[4])]
    assert record_1_data[str(columns_id[5])] != record_2_data[str(columns_id[5])]


def test_foreign_key_record_api_all_column_previews(publication_tables, client):
    author_table, publisher_table, publication_table, checkouts_table = publication_tables
    author_template_columns = author_table.get_columns_by_name(["first_name", "last_name", "id"])
    author_preview_template = f'Full Name: {{{ author_template_columns[0].id }}} {{{author_template_columns[1].id}}}'
    author_table_settings_id = author_table.settings.id
    data = {
        "preview_settings": {
            'template': author_preview_template,
        }
    }
    response = client.patch(
        f"/api/db/v0/tables/{author_table.id}/settings/{author_table_settings_id}/",
        data=data,
    )
    assert response.status_code == 200
    publisher_template_columns = publisher_table.get_columns_by_name(["name", "id"])
    publisher_preview_template = f'{{{ publisher_template_columns[0].id }}}'
    publisher_table_settings_id = publisher_table.settings.id
    data = {
        "preview_settings": {
            'template': publisher_preview_template,
        }
    }
    response = client.patch(
        f"/api/db/v0/tables/{publisher_table.id}/settings/{publisher_table_settings_id}/",
        data=data,
    )
    assert response.status_code == 200
    publication_template_columns = publication_table.get_columns_by_name(['publisher', 'author', 'co_author', 'title', 'id'])
    publication_preview_template = f'{{{publication_template_columns[3].id}}} Published By: {{{ publication_template_columns[0].id}}} and Authored by {{{publication_template_columns[1].id}}} along with {{{publication_template_columns[2].id}}}'
    publication_table_settings_id = publication_table.settings.id
    data = {
        "preview_settings": {
            'template': publication_preview_template,
        }
    }
    response = client.patch(
        f"/api/db/v0/tables/{publication_table.id}/settings/{publication_table_settings_id}/",
        data=data,
    )
    assert response.status_code == 200
    response = client.get(f'/api/db/v0/tables/{checkouts_table.id}/records/')
    response_data = response.json()
    preview_data = response_data['preview_data']
    checkouts_table_publication_fk_column = checkouts_table.get_column_by_name('publication')
    preview_column = next(
        preview
        for preview in preview_data
        if preview['column'] == checkouts_table_publication_fk_column.id
    )
    publication_path = [[checkouts_table_publication_fk_column.id, publication_template_columns[-1].id]]
    publisher_paths = publication_path + [[publication_template_columns[0].id, publisher_template_columns[-1].id]]
    author_paths = publication_path + [[publication_template_columns[1].id, author_template_columns[-1].id]]
    co_author_paths = publication_path + [[publication_template_columns[2].id, author_template_columns[-1].id]]
    publication_path_prefix = compute_path_prefix(publication_path)
    publisher_path_prefix = compute_path_prefix(publisher_paths)
    co_author_path_path_prefix = compute_path_prefix(co_author_paths)
    author_path_prefix = compute_path_prefix(author_paths)
    publication_title_alias = compute_path_str(publication_path_prefix, publication_template_columns[3].id)
    publisher_name_alias = compute_path_str(publisher_path_prefix, publisher_template_columns[0].id)
    co_author_first_name_alias = compute_path_str(co_author_path_path_prefix, author_template_columns[0].id)
    co_author_last_name_alias = compute_path_str(co_author_path_path_prefix, author_template_columns[1].id)
    author_first_name_alias = compute_path_str(author_path_prefix, author_template_columns[0].id)
    author_last_name_alias = compute_path_str(author_path_prefix, author_template_columns[1].id)
    preview_column_alias = f'{{{publication_title_alias}}} Published By: {{{ publisher_name_alias}}} and Authored by Full Name: {{{author_first_name_alias}}} {{{author_last_name_alias}}} along with Full Name: {{{co_author_first_name_alias}}} {{{co_author_last_name_alias}}}'

    assert preview_column['template'] == preview_column_alias
    preview_data = preview_column['data'][0]
    assert all([key in preview_data for key in [publication_title_alias, publisher_name_alias, author_first_name_alias, author_last_name_alias, co_author_first_name_alias, co_author_last_name_alias]])

    expected_preview_data = {publication_title_alias: 'Pressure Should Old', publisher_name_alias: 'Ruiz', author_first_name_alias: 'Matthew', author_last_name_alias: 'Brown', co_author_first_name_alias: 'Mark', co_author_last_name_alias: 'Smith'}
    assert preview_data == expected_preview_data


def test_record_detail(publication_tables, client):
    author_table, publisher_table, publication_table, checkouts_table = publication_tables
    record_id = 1
    record = checkouts_table.get_record(record_id)

    response = client.get(f'/api/db/v0/tables/{checkouts_table.id}/records/{record_id}/')
    record_data = response.json()['results'][0]
    preview_data = response.json()['preview_data']
    record_as_dict = record._asdict()

    assert response.status_code == 200
    columns_name_id_map = checkouts_table.get_column_name_id_bidirectional_map()
    for column_name in checkouts_table.sa_column_names:
        column_id_str = str(columns_name_id_map[column_name])
        assert column_id_str in record_data
        assert record_as_dict[column_name] == record_data[column_id_str]
    checkouts_table_publication_fk_column = checkouts_table.get_column_by_name('publication')
    preview_column = next(
        preview
        for preview in preview_data
        if preview['column'] == checkouts_table_publication_fk_column.id
    )
    publication_template_columns = publication_table.get_columns_by_name(['title', 'id'])
    publication_path = [[checkouts_table_publication_fk_column.id, publication_template_columns[-1].id]]
    publication_title_alias = compute_path_str(
        compute_path_prefix(publication_path),
        publication_template_columns[0].id
    )
    preview_column_alias = f'{{{publication_title_alias}}}'

    assert preview_column['template'] == preview_column_alias


def test_record_create(create_patents_table, client):
    table_name = 'NASA Record Create'
    table = create_patents_table(table_name)
    records = table.get_records()
    original_num_records = len(records)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    data = {
        columns_name_id_map['Center']: 'NASA Example Space Center',
        columns_name_id_map['Status']: 'Application',
        columns_name_id_map['Case Number']: 'ESC-0000',
        columns_name_id_map['Patent Number']: '01234',
        columns_name_id_map['Application SN']: '01/000,001',
        columns_name_id_map['Title']: 'Example Patent Name',
        columns_name_id_map['Patent Expiration Date']: ''
    }
    response = client.post(f'/api/db/v0/tables/{table.id}/records/', data=data)
    record_data = response.json()['results'][0]
    assert response.status_code == 201
    assert len(table.get_records()) == original_num_records + 1
    columns_name_id_map = table.get_column_name_id_bidirectional_map()

    for column_name in table.sa_column_names:
        column_id_str = str(columns_name_id_map[column_name])
        assert column_id_str in record_data
        if column_name in data:
            assert data[column_name] == record_data[column_id_str]


def test_record_partial_update(create_patents_table, client):
    table_name = 'NASA Record Patch'
    table = create_patents_table(table_name)
    records = table.get_records()
    record_id = records[0]['id']

    original_response = client.get(f'/api/db/v0/tables/{table.id}/records/{record_id}/')
    original_data = original_response.json()['results'][0]
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    data = {
        columns_name_id_map['Center']: 'NASA Example Space Center',
        columns_name_id_map['Status']: 'Example',
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/records/{record_id}/', data=data)
    record_data = response.json()['results'][0]
    assert response.status_code == 200
    for column_name in table.sa_column_names:
        column_id_str = str(columns_name_id_map[column_name])
        assert column_id_str in record_data
        if column_id_str in data and column_name not in ['Center', 'Status']:
            assert original_data[column_id_str] == record_data[column_id_str]
        elif column_name == 'Center':
            assert original_data[column_id_str] != record_data[column_id_str]
            assert record_data[column_id_str] == 'NASA Example Space Center'
        elif column_name == 'Status':
            assert original_data[column_id_str] != record_data[column_id_str]
            assert record_data[column_id_str] == 'Example'


def test_record_delete(create_patents_table, client):
    table_name = 'NASA Record Delete'
    table = create_patents_table(table_name)
    records = table.get_records()
    original_num_records = len(records)
    record_id = records[0]['id']

    response = client.delete(f'/api/db/v0/tables/{table.id}/records/{record_id}/')
    assert response.status_code == 204
    assert len(table.get_records()) == original_num_records - 1


def test_record_update(create_patents_table, client):
    table_name = 'NASA Record Put'
    table = create_patents_table(table_name)
    records = table.get_records()
    record_id = records[0]['id']

    data = {
        'Center': 'NASA Example Space Center',
        'Status': 'Example',
    }
    response = client.put(f'/api/db/v0/tables/{table.id}/records/{record_id}/', data=data)
    assert response.status_code == 405
    assert response.json()[0]['message'] == 'Method "PUT" not allowed.'
    assert response.json()[0]['code'] == ErrorCodes.MethodNotAllowed.value


def test_record_404(create_patents_table, client):
    table_name = 'NASA Record 404'
    table = create_patents_table(table_name)
    records = table.get_records()
    record_id = records[0]['id']

    client.delete(f'/api/db/v0/tables/{table.id}/records/{record_id}/')
    response = client.get(f'/api/db/v0/tables/{table.id}/records/{record_id}/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_record_list_filter_exceptions(create_patents_table, client):
    exception = UnknownDBFunctionID
    table_name = f"NASA Record List {exception.__name__}"
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    filter_list = json.dumps({"empty": [{"column_name": [columns_name_id_map['Center']]}]})
    with patch.object(DBQuery, "get_records", side_effect=exception):
        response = client.get(
            f'/api/db/v0/tables/{table.id}/records/?filters={filter_list}'
        )
        response_data = response.json()
    assert response.status_code == 400
    assert len(response_data) == 1
    assert "filters" in response_data[0]['field']
    assert response_data[0]['code'] == ErrorCodes.UnsupportedType.value


@pytest.mark.parametrize("exception", [BadSortFormat, SortFieldNotFound])
def test_record_list_sort_exceptions(create_patents_table, client, exception):
    table_name = f"NASA Record List {exception.__name__}"
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    order_by = json.dumps([{"field": columns_name_id_map['id'], "direction": "desc"}])
    with patch.object(DBQuery, "get_records", side_effect=exception):
        response = client.get(
            f'/api/db/v0/tables/{table.id}/records/?order_by={order_by}'
        )
        response_data = response.json()
    assert response.status_code == 400
    assert len(response_data) == 1
    assert "order_by" in response_data[0]['field']
    assert response_data[0]['code'] == ErrorCodes.UnsupportedType.value


@pytest.mark.parametrize("exception", [BadGroupFormat, GroupFieldNotFound])
def test_record_list_group_exceptions(create_patents_table, client, exception):
    table_name = f"NASA Record List {exception.__name__}"
    table = create_patents_table(table_name)
    columns_name_id_map = table.get_column_name_id_bidirectional_map()
    group_by = json.dumps({"columns": [columns_name_id_map['Case Number']]})
    with patch.object(DBQuery, "get_records", side_effect=exception):
        response = client.get(
            f'/api/db/v0/tables/{table.id}/records/?grouping={group_by}'
        )
        response_data = response.json()
    assert response.status_code == 400
    assert len(response_data) == 1
    assert "grouping" in response_data[0]['field']
    assert response_data[0]['code'] == ErrorCodes.UnsupportedType.value


@pytest.mark.parametrize("test_input, expected", [
    ("0", True),
    ("-0", True),
    ("0.314", True),
    ("-0.00314", True),
    ("0.0314e3", True),
    ("0.0314e+3", True),
    ("0.0314e-3", True),
    ("0.314e01", True),
    ("-314", True),
    ("-0314", False),
    ("314", True),
    ("0314", False),
    ("100.04", True),
    ("100.", False),
    ("314e3", True),
    ("314E+3", True),
    ("314e-3", True),
    ("314.0e-3", True),
    ("314.0E+3", True),
    ("314.0E1", True),
    ("~2324", False)
])
def test_json_number_spec_validation(test_input, expected):
    assert follows_json_number_spec(test_input) == expected


def test_number_input_api_validation(empty_nasa_table, client):
    table = empty_nasa_table
    column_name = 'Nonce'
    table.add_column({"name": column_name, "type": 'REAL'})
    nonce_id = table.get_column_name_id_bidirectional_map()[column_name]

    for nonce, status_code in [
        ("0", 201),
        ("-0.00314", 201),
        ("-314", 201),
        ("-0314", 400),
        ("314.0e-3", 201),
        ("~2324", 400),
        (2132, 201),
    ]:
        data = {
            nonce_id: nonce,
        }
        response = client.post(f'/api/db/v0/tables/{table.id}/records/', data=data)
        assert response.status_code == status_code


def test_record_patch_invalid_date(create_patents_table, client):
    table_name = 'NASA Invalid Date'
    table = create_patents_table(table_name)
    column_id_with_date_type = table.get_column_name_id_bidirectional_map()['Patent Expiration Date']
    column_attnum = table.columns.get(id=column_id_with_date_type).attnum
    table.alter_column(column_attnum, {'type': 'date'})
    data = {f"{column_id_with_date_type}": "99/99/9999"}
    response = client.patch(f'/api/db/v0/tables/{table.id}/records/17/', data=data)
    response_data = response.json()
    assert response.status_code == 400
    assert response_data[0]['code'] == ErrorCodes.InvalidDateError.value
    assert response_data[0]['message'] == 'Invalid date'


def test_record_patch_invalid_date_format(create_patents_table, client):
    table_name = 'NASA Invalid Date Format'
    table = create_patents_table(table_name)
    column_id_with_date_type = table.get_column_name_id_bidirectional_map()['Patent Expiration Date']
    column_attnum = table.columns.get(id=column_id_with_date_type).attnum
    table.alter_column(column_attnum, {'type': 'date'})
    data = {f"{column_id_with_date_type}": "5555/5555"}
    response = client.patch(f'/api/db/v0/tables/{table.id}/records/17/', data=data)
    response_data = response.json()
    assert response.status_code == 400
    assert response_data[0]['code'] == ErrorCodes.InvalidDateFormatError.value
    assert response_data[0]['message'] == 'Invalid date format'
