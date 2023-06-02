display_option_origin = "display_option_origin"


def test_alias(library_ma_tables, get_uid, client):
    _ = library_ma_tables
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
            {"id": columns["Patron"]["id"], "alias": "Patron"},
        ],
        "display_names": {
            "Checkout Month": "Month",
            "Count": "Number of Checkouts",
            "Sum": "Sum of patron",
        },
        "display_options": {
            "Checkout Time": {
                display_option_origin: "Checkout Time",
            },
            "id": {
                display_option_origin: "id",
            },
            "Patron": {
                display_option_origin: "Patron",
            },
        },
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
                        },
                        {
                            "input_alias": "Patron",
                            "output_alias": "Sum",
                            "function": "sum",
                        }
                    ]
                },
                "type": "summarize",
            }
        ]
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 201
    query_id = response.json()["id"]
    expect_repsonse_data = [
        {
            'alias': 'Checkout Month',
            'display_name': 'Month',
            'type': 'text',
            'type_options': None,
            'display_options': {
                display_option_origin: "Checkout Time",
            },
            'is_initial_column': False,
            'input_table_name': None,
            'input_table_id': None,
            'input_column_name': None,
            'input_alias': 'Checkout Time',
        }, {
            'alias': 'Count',
            'display_name': 'Number of Checkouts',
            'type': 'integer',
            'type_options': None,
            'display_options': {
                display_option_origin: "id",
            },
            'is_initial_column': False,
            'input_table_name': None,
            'input_table_id': None,
            'input_column_name': None,
            'input_alias': 'id',
        }, {
            'alias': 'Sum',
            'display_name': 'Sum of patron',
            'type': 'numeric',
            'type_options': None,
            'display_options': {
                display_option_origin: "Patron",
            },
            'is_initial_column': False,
            'input_table_name': None,
            'input_table_id': None,
            'input_column_name': None,
            'input_alias': 'Patron',
        }
    ]
    actual_response_data = client.get(f'/api/db/v0/queries/{query_id}/columns/').json()
    assert sorted(actual_response_data, key=lambda x: x['alias']) == expect_repsonse_data


def test_count_aggregation(library_ma_tables, get_uid, client):
    _ = library_ma_tables
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
        "display_names": {
            "Checkout Month": "Month",
            "Count": "Number of Checkouts",
        },
        "display_options": {
            "Checkout Time": {
                display_option_origin: "Checkout Time",
            },
            "id": {
                display_option_origin: "id",
            },
        },
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
            }
        ]
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 201
    query_id = response.json()['id']
    expect_records = [
        {'Checkout Month': '2022-05', 'Count': 39},
        {'Checkout Month': '2022-06', 'Count': 26},
        {'Checkout Month': '2022-07', 'Count': 29},
        {'Checkout Month': '2022-08', 'Count': 10},
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Checkout Month']) == expect_records


def test_sum_aggregation(library_ma_tables, get_uid, client):
    _ = library_ma_tables
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
            {"id": columns["Checkout Time"]["id"], "alias": "Checkout Time"},
            {"id": columns["Patron"]["id"], "alias": "Patron"},
        ],
        "display_names": {
            "Checkout Month": "Month",
            "Sum": "Sum of patron",
        },
        "display_options": {
            "Checkout Time": {
                display_option_origin: "Checkout Time",
            },
            "Patron": {
                display_option_origin: "Patron",
            },
        },
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
                            "input_alias": "Patron",
                            "output_alias": "Sum",
                            "function": "sum",
                        }
                    ]
                },
                "type": "summarize",
            }
        ]
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 201
    query_id = response.json()['id']
    expect_records = [
        {'Checkout Month': '2022-05', 'Sum': 649},
        {'Checkout Month': '2022-06', 'Sum': 298},
        {'Checkout Month': '2022-07', 'Sum': 524},
        {'Checkout Month': '2022-08', 'Sum': 126},
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Checkout Month']) == expect_records
