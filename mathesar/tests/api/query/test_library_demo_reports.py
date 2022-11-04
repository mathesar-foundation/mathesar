import pytest


@pytest.fixture
def create_overdue_books_query(library_ma_tables, get_uid, client):
    checkouts = library_ma_tables["Checkouts"]
    patrons = library_ma_tables["Patrons"]
    items = library_ma_tables["Items"]
    publications = library_ma_tables["Publications"]
    request_data = {
        "name": get_uid(),
        "base_table": checkouts.id,
        "initial_columns": [
            {
                "id": checkouts.get_column_by_name("id").id,
                "alias": "Checkout id"
            }, {
                "id": checkouts.get_column_by_name("Due Date").id,
                "alias": "Due Date"
            }, {
                "id": checkouts.get_column_by_name("Check In Time").id,
                "alias": "Check In Time"
            }, {
                "id": patrons.get_column_by_name("Email").id,
                "alias": "email",
                "display_name": "Patron Email",
                "jp_path": [
                    [
                        checkouts.get_column_by_name("Patron").id,
                        patrons.get_column_by_name("id").id,
                    ]
                ]
            }, {
                "id": publications.get_column_by_name("Title").id,
                "alias": "Book Title",
                "jp_path": [
                    [
                        checkouts.get_column_by_name("Item").id,
                        items.get_column_by_name("id").id,
                    ], [
                        items.get_column_by_name("Publication").id,
                        publications.get_column_by_name("id").id,
                    ]
                ]
            },
        ],
        "transformations": [
            {
                "spec": {
                    "lesser": [
                        {"column_name": ["Due Date"]},
                        {"literal": ["2022-08-10"]}
                    ]
                },
                "type": "filter"
            },
            {
                "spec": {
                    "empty": [{"column_name": ["Check In Time"]}]
                },
                "type": "filter"
            },
            {
                "spec": {
                    "grouping_expressions": [{"input_alias": "email"}],
                    "aggregation_expressions": [
                        {
                            "input_alias": "Book Title",
                            "output_alias": "Title List",
                            "function": "aggregate_to_array"
                        }
                    ]
                },
                "type": "summarize",
                "display_names": {
                    "Title List": "Titles"
                }
            }
        ],

    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 201
    return response


@pytest.fixture
def check_overdue_books_columns(create_overdue_books_query, client):
    query_id = create_overdue_books_query.json()['id']
    expect_response_data = [
        {
            'alias': 'Title List',
            'display_name': 'Titles',
            'type': '_array',
            'type_options': {'item_type': 'text'},
            'display_options': None,
            'is_initial_column': False,
            'is_summarization_output_column': True,
            'summarization_input_alias': 'Book Title',
        }, {
            'alias': 'email',
            'display_name': 'Patron Email',
            'type': 'mathesar_types.email',
            'type_options': None,
            'display_options': None,
            'is_initial_column': True,
            'base_table_name': 'Patrons',
            'base_column_name': 'Email',
        }
    ]
    actual_response_data = client.get(f'/api/db/v0/queries/{query_id}/columns/').json()
    assert sorted(actual_response_data, key=lambda x: x['alias']) == expect_response_data
    return query_id


@pytest.fixture
def run_overdue_books_scenario(check_overdue_books_columns, client):
    query_id = check_overdue_books_columns
    expect_records = [
        {
            'email': 'eduardorojas13@peterson-curry.com',
            'Title List': ['Bar Order Might Per', 'Hand Raise Son Probably Do']
        }, {
            'email': 'heatherwheeler@peterson-delgado.com',
            'Title List': ['Bar Order Might Per', 'I Worker Suffer Likely']
        }, {
            'email': 'jhooper@bowers.com',
            'Title List': ['Military Myself Sport Wrong']
        }, {
            'email': 'kathyb@le.org',
            'Title List': ['Pass Street Year']
        }, {
            'email': 'kwright@odonnell.com',
            'Title List': ['Day Beyond Property', 'On Letter Experience']
        }, {
            'email': 'tevans46@thompson.net',
            'Title List': ['Space Music Rest Crime']
        }, {
            'email': 'y.ho@johnson.info',
            'Title List': ['Mention Add Size City Kid', 'Economic Too Level']
        }
    ]
    actual_records = sorted(
        client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results'],
        key=lambda x: x['email']
    )
    for rec_pair in zip(actual_records, expect_records):
        assert rec_pair[0]['email'] == rec_pair[1]['email']
        assert sorted(rec_pair[0]['Title List']) == sorted(rec_pair[1]['Title List'])


@pytest.fixture
def create_monthly_checkouts_query(run_overdue_books_scenario, get_uid, client):
    _ = run_overdue_books_scenario
    checkouts = {
        t["name"]: t for t in client.get("/api/db/v0/tables/").json()["results"]
    }["Checkouts"]
    columns = {
        c["name"]: c for c in checkouts["columns"]
    }
    request_data = {
        "name": get_uid(),
        "base_table": checkouts["id"],
        "initial_columns": [
            {"id": columns["id"]["id"], "alias": "id"},
            {"id": columns["Checkout Time"]["id"], "alias": "Checkout Time"},
        ],
        "transformations": [
            {
                "spec": {
                    "grouping_expressions": [
                        {
                            "input_alias": "Checkout Time",
                            "output_alias": "Checkout Month",
                            "preproc": "truncate_to_month",
                        }
                    ],
                    "aggregation_expressions": [
                        {
                            "input_alias": "id",
                            "output_alias": "Count",
                            "function": "count",
                        }
                    ]
                },
                "type": "summarize",
                "display_names": {
                    "Checkout Month": "Month",
                    "Count": "Number of Checkouts"
                }
            }
        ]
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 201
    return response


@pytest.fixture
def check_monthly_checkouts_columns(create_monthly_checkouts_query, client):
    query_id = create_monthly_checkouts_query.json()['id']
    expect_repsonse_data = [
        {
            'alias': 'Checkout Month',
            'display_name': 'Month',
            'type': 'text',
            'type_options': None,
            'display_options': None,
            'is_initial_column': False,
            'is_summarization_output_column': True,
            'summarization_input_alias': 'Checkout Time',
        }, {
            'alias': 'Count',
            'display_name': 'Number of Checkouts',
            'type': 'integer',
            'type_options': None,
            'display_options': None,
            'is_initial_column': False,
            'is_summarization_output_column': True,
            'summarization_input_alias': 'id',
        }
    ]
    actual_response_data = client.get(f'/api/db/v0/queries/{query_id}/columns/').json()
    assert sorted(actual_response_data, key=lambda x: x['alias']) == expect_repsonse_data
    return query_id


def test_monthly_checkouts_scenario(check_monthly_checkouts_columns, client):
    query_id = check_monthly_checkouts_columns
    expect_records = [
        {'Checkout Month': '2022-05', 'Count': 39},
        {'Checkout Month': '2022-06', 'Count': 26},
        {'Checkout Month': '2022-07', 'Count': 29},
        {'Checkout Month': '2022-08', 'Count': 10},
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Checkout Month']) == expect_records
