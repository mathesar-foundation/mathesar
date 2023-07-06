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


def test_mean_aggregation(library_ma_tables, get_uid, client):
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
            "Mean": "Mean of patron",
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
                            "output_alias": "Mean",
                            "function": "mean",
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
        {'Checkout Month': '2022-05', 'Mean': 16.641025641025642},
        {'Checkout Month': '2022-06', 'Mean': 11.461538461538462},
        {'Checkout Month': '2022-07', 'Mean': 18.06896551724138},
        {'Checkout Month': '2022-08', 'Mean': 12.6},
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


def test_median_aggregation(library_ma_tables, get_uid, client):
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
            "Median": "Median of patron",
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
                            "output_alias": "Median",
                            "function": "median",
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
        {'Checkout Month': '2022-05', 'Median': 18},
        {'Checkout Month': '2022-06', 'Median': 8},
        {'Checkout Month': '2022-07', 'Median': 20},
        {'Checkout Month': '2022-08', 'Median': 11},
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Checkout Month']) == expect_records


def test_mode_aggregation(library_ma_tables, get_uid, client):
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
            "Mode": "Mode of patron",
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
                            "output_alias": "Mode",
                            "function": "mode",
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
        {'Checkout Month': '2022-05', 'Mode': 11},
        {'Checkout Month': '2022-06', 'Mode': 2},
        {'Checkout Month': '2022-07', 'Mode': 22},
        {'Checkout Month': '2022-08', 'Mode': 3},
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Checkout Month']) == expect_records


def test_max_aggregation(library_ma_tables, get_uid, client):
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
            "Max": "Max of patron",
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
                            "output_alias": "Max",
                            "function": "max",
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
        {'Checkout Month': '2022-05', 'Max': 29},
        {'Checkout Month': '2022-06', 'Max': 27},
        {'Checkout Month': '2022-07', 'Max': 29},
        {'Checkout Month': '2022-08', 'Max': 29},
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Checkout Month']) == expect_records


def test_peak_time_aggregation(library_ma_tables, get_uid, client):
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
            "Checkout Time": "Checkout Time",
            "Patron": "Patron",
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
                            "input_alias": "Patron",
                            "output_alias": "Patron",
                        }
                    ],
                    "aggregation_expressions": [
                        {
                            "input_alias": "Checkout Time",
                            "output_alias": "Checkout Time",
                            "function": "peak_time",
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
        {
            "Patron":1,
            "Checkout Time":"12:54:00.286569"
        },
        {
            "Patron":2,
            "Checkout Time":"12:33:56.911007"
        },
        {
            "Patron":3,
            "Checkout Time":"15:59:15.468421"
        },
        {
            "Patron":4,
            "Checkout Time":"19:32:29.14247"
        },
        {
            "Patron":5,
            "Checkout Time":"13:14:47.698064"
        },
        {
            "Patron":6,
            "Checkout Time":"14:03:59.331127"
        },
        {
            "Patron":7,
            "Checkout Time":"12:39:06.036969"
        },
        {
            "Patron":8,
            "Checkout Time":"13:11:37.322141"
        },
        {
            "Patron":9,
            "Checkout Time":"15:42:14.208165"
        },
        {
            "Patron":10,
            "Checkout Time":"15:34:02.558857"
        },
        {
            "Patron":11,
            "Checkout Time":"14:25:18.50151"
        },
        {
            "Patron":12,
            "Checkout Time":"19:38:12.268677"
        },
        {
            "Patron":13,
            "Checkout Time":"12:31:00.403794"
        },
        {
            "Patron":14,
            "Checkout Time":"13:26:25.293263"
        },
        {
            "Patron":15,
            "Checkout Time":"13:34:53.582087"
        },
        {
            "Patron":16,
            "Checkout Time":"15:23:23.148845"
        },
        {
            "Patron":17,
            "Checkout Time":"16:39:21.51814"
        },
        {
            "Patron":18,
            "Checkout Time":"15:56:47.170538"
        },
        {
            "Patron":19,
            "Checkout Time":"13:05:33.506587"
        },
        {
            "Patron":20,
            "Checkout Time":"15:45:13.753633"
        },
        {
            "Patron":21,
            "Checkout Time":"11:40:36.809586"
        },
        {
            "Patron":22,
            "Checkout Time":"13:25:09.374102"
        },
        {
            "Patron":23,
            "Checkout Time":"14:18:54.097847"
        },
        {
            "Patron":24,
            "Checkout Time":"15:30:34.310875"
        },
        {
            "Patron":25,
            "Checkout Time":"13:03:00.9767"
        },
        {
            "Patron":26,
            "Checkout Time":"17:14:35.469216"
        },
        {
            "Patron":27,
            "Checkout Time":"13:41:13.814894"
        },
        {
            "Patron":28,
            "Checkout Time":"15:51:15.074412"
        },
        {
            "Patron":29,
            "Checkout Time":"16:03:31.517422"
        }
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Patron']) == expect_records


def test_min_aggregation(library_ma_tables, get_uid, client):
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
            "Min": "Min of patron",
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
                            "output_alias": "Min",
                            "function": "min",
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
        {'Checkout Month': '2022-05', 'Min': 1},
        {'Checkout Month': '2022-06', 'Min': 2},
        {'Checkout Month': '2022-07', 'Min': 3},
        {'Checkout Month': '2022-08', 'Min': 3},
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Checkout Month']) == expect_records


def test_percentage_true_aggregation(payments_ma_table, get_uid, client):
    _ = payments_ma_table
    payments = {
        t["name"]: t for t in client.get("/api/db/v0/tables/").json()["results"]
    }["Payments"]
    columns = {
        c["name"]: c for c in payments["columns"]
    }
    request_data = {
        "name": get_uid(),
        "base_table": payments["id"],
        "initial_columns": [
            {"id": columns["Payment Mode"]["id"], "alias": "Payment Mode"},
            {"id": columns["Is Fraudulent"]["id"], "alias": "Is Fraudulent"},
        ],
        "display_names": {
            "Payment Mode": "Payment Mode",
            "Percentage Fraudulent": "Percentage Fraudulent",
        },
        "display_options": {
            "Payment Mode": {
                display_option_origin: "Payment Mode",
            },
            "Is Fraudulent": {
                display_option_origin: "Is Fraudulent",
            },
        },
        "transformations": [
            {
                "spec": {
                    "grouping_expressions": [
                        {
                            "input_alias": "Payment Mode",
                            "output_alias": "Payment Mode",
                        }
                    ],
                    "aggregation_expressions": [
                        {
                            "input_alias": "Is Fraudulent",
                            "output_alias": "Percentage Fraudulent",
                            "function": "percentage_true",
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
        {
            'Payment Mode': 'UPI',
            'Percentage Fraudulent': 16.666666666666668
        },
        {
            'Payment Mode': 'credit card',
            'Percentage Fraudulent': 10.0
        },
        {
            'Payment Mode': 'debit card',
            'Percentage Fraudulent': 10.81081081081081
        },
        {
            'Payment Mode': 'pay later',
            'Percentage Fraudulent': 14.285714285714286
        },
        {
            'Payment Mode': 'wallet',
            'Percentage Fraudulent': 23.333333333333332
        }
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Payment Mode']) == expect_records


def test_Mathesar_money_distinct_list_aggregation(library_ma_tables, get_uid, client):
    _ = library_ma_tables
    items = {
        t["name"]: t for t in client.get("/api/db/v0/tables/").json()["results"]
    }["Items"]
    columns = {
        c["name"]: c for c in items["columns"]
    }
    request_data = {
        "name": get_uid(),
        "base_table": items["id"],
        "initial_columns": [
            {"id": columns["Publication"]["id"], "alias": "Publication"},
            {"id": columns["Acquisition Price"]["id"], "alias": "Acquisition Price"},
        ],
        "display_names": {
            "Acquisition Price": "Price",
            "Publication": "Publication",
        },
        "display_options": {
            "Publication": {
                display_option_origin: "Publication",
            },
            "Acquisition Price": {
                display_option_origin: "Acquisition Price",
            },
        },
        "transformations": [
            {
                "spec": {
                    "grouping_expressions": [
                        {
                            "input_alias": "Publication",
                            "output_alias": "Publication",
                        }
                    ],
                    "aggregation_expressions": [
                        {
                            "input_alias": "Acquisition Price",
                            "output_alias": "Acquisition Price",
                            "function": "distinct_aggregate_to_array"
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
        {
            "Publication": 1,
            "Acquisition Price": [
                0.59
            ]
        },
        {
            "Publication": 2,
            "Acquisition Price": [
                6.09
            ]
        },
        {
            "Publication": 3,
            "Acquisition Price": [
                3.89
            ]
        },
        {
            "Publication": 4,
            "Acquisition Price": [
                11.42,
                13.55
            ]
        },
        {
            "Publication": 5,
            "Acquisition Price": [
                10.75
            ]
        },
        {
            "Publication": 6,
            "Acquisition Price": [
                12.08
            ]
        },
        {
            "Publication": 7,
            "Acquisition Price": [
                4.66
            ]
        },
        {
            "Publication": 8,
            "Acquisition Price": [
                0.1
            ]
        },
        {
            "Publication": 9,
            "Acquisition Price": [
                11.05,
                14.94
            ]
        },
        {
            "Publication": 10,
            "Acquisition Price": [
                1.75,
                3.88
            ]
        },
        {
            "Publication": 11,
            "Acquisition Price": [
                4.8
            ]
        },
        {
            "Publication": 12,
            "Acquisition Price": [
                1.31
            ]
        },
        {
            "Publication": 13,
            "Acquisition Price": [
                2.06,
                7.77
            ]
        },
        {
            "Publication": 14,
            "Acquisition Price": [
                8.26
            ]
        },
        {
            "Publication": 15,
            "Acquisition Price": [
                3.09,
                3.73,
                3.76,
                9.6,
                11.77,
                13.06
            ]
        },
        {
            "Publication": 16,
            "Acquisition Price": [
                4.28
            ]
        },
        {
            "Publication": 17,
            "Acquisition Price": [
                2.03,
                3.23
            ]
        },
        {
            "Publication": 18,
            "Acquisition Price": [
                3.62,
                5.45,
                9.77,
                10.78
            ]
        },
        {
            "Publication": 19,
            "Acquisition Price": [
                9.55
            ]
        },
        {
            "Publication": 20,
            "Acquisition Price": [
                0.16,
                5.28
            ]
        },
        {
            "Publication": 21,
            "Acquisition Price": [
                5.29
            ]
        },
        {
            "Publication": 22,
            "Acquisition Price": [
                8.91,
                12.06,
                14.76
            ]
        },
        {
            "Publication": 23,
            "Acquisition Price": [
                4.69,
                14.48
            ]
        },
        {
            "Publication": 24,
            "Acquisition Price": [
                2.08,
                4.52,
                12.53
            ]
        },
        {
            "Publication": 25,
            "Acquisition Price": [
                7.45,
                10.39
            ]
        },
        {
            "Publication": 26,
            "Acquisition Price": [
                3.36,
                14.59
            ]
        },
        {
            "Publication": 27,
            "Acquisition Price": [
                1.12
            ]
        },
        {
            "Publication": 28,
            "Acquisition Price": [
                3.18,
                12.24
            ]
        },
        {
            "Publication": 29,
            "Acquisition Price": [
                10.6
            ]
        },
        {
            "Publication": 30,
            "Acquisition Price": [
                6.38
            ]
        },
        {
            "Publication": 31,
            "Acquisition Price": [
                8.47
            ]
        },
        {
            "Publication": 32,
            "Acquisition Price": [
                2.11
            ]
        },
        {
            "Publication": 33,
            "Acquisition Price": [
                2.77
            ]
        },
        {
            "Publication": 34,
            "Acquisition Price": [
                9.23,
                10.27,
                10.82,
                12.35,
                12.78
            ]
        },
        {
            "Publication": 35,
            "Acquisition Price": [
                8.25
            ]
        },
        {
            "Publication": 36,
            "Acquisition Price": [
                12.79,
                12.98,
                13.96
            ]
        },
        {
            "Publication": 37,
            "Acquisition Price": [
                1.88,
                5.57,
                10.81,
                13.37
            ]
        },
        {
            "Publication": 38,
            "Acquisition Price": [
                12.01
            ]
        },
        {
            "Publication": 39,
            "Acquisition Price": [
                3.17
            ]
        },
        {
            "Publication": 40,
            "Acquisition Price": [
                2.73,
                10.1
            ]
        },
        {
            "Publication": 41,
            "Acquisition Price": [
                10.55,
                13.57
            ]
        },
        {
            "Publication": 42,
            "Acquisition Price": [
                8.31,
                9.27,
                11.83
            ]
        },
        {
            "Publication": 43,
            "Acquisition Price": [
                6.63,
                13.27
            ]
        },
        {
            "Publication": 44,
            "Acquisition Price": [
                5.14
            ]
        },
        {
            "Publication": 45,
            "Acquisition Price": [
                7.21
            ]
        },
        {
            "Publication": 46,
            "Acquisition Price": [
                13.85
            ]
        },
        {
            "Publication": 47,
            "Acquisition Price": [
                10.93,
                10.99
            ]
        },
        {
            "Publication": 48,
            "Acquisition Price": [
                4.02,
                6.41,
                9.6,
                10.83,
                14.32
            ]
        },
        {
            "Publication": 49,
            "Acquisition Price": [
                5.74,
                6.66,
                13.08
            ]
        },
        {
            "Publication": 50,
            "Acquisition Price": [
                6.97,
                13.75
            ]
        }
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Publication']) == expect_records


def test_Mathesar_URI_distinct_list_aggregation(library_ma_tables, get_uid, client):
    _ = library_ma_tables
    authors = {
        t["name"]: t for t in client.get("/api/db/v0/tables/").json()["results"]
    }["Authors"]
    columns = {
        c["name"]: c for c in authors["columns"]
    }
    request_data = {
        "name": get_uid(),
        "base_table": authors["id"],
        "initial_columns": [
            {"id": columns["Author Last Name"]["id"], "alias": "Author Last Name"},
            {"id": columns["Author Website"]["id"], "alias": "Author Website"},
        ],
        "display_names": {
            "Author Last Name": "Author Last Name",
            "Website": "Website",
        },
        "display_options": {
            "Author Last Name": {
                display_option_origin: "Author Last Name",
            },
            "Author Website": {
                display_option_origin: "Author Website",
            },
        },
        "transformations": [
            {
                "spec": {
                    "grouping_expressions": [
                        {
                            "input_alias": "Author Last Name",
                            "output_alias": "Author Last Name",
                        }
                    ],
                    "aggregation_expressions": [
                        {
                            "input_alias": "Author Website",
                            "output_alias": "Website",
                            "function": "distinct_aggregate_to_array",
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
        {
            "Author Last Name": "Castillo",
            "Website": [
                "https://jennifercastillo.com"
            ]
        },
        {
            "Author Last Name": "Diaz",
            "Website": [
                "https://diaz.net"
            ]
        },
        {
            "Author Last Name": "Dunlap",
            "Website": [
                "https://dunlap.com"
            ]
        },
        {
            "Author Last Name": "Edwards",
            "Website": [
                "https://catherineedwards.com",
                "https://edwards.info"
            ]
        },
        {
            "Author Last Name": "Evans",
            "Website": [
                "https://bonnieevans.com"
            ]
        },
        {
            "Author Last Name": "Harris",
            "Website": [
                "http://harris.info"
            ]
        },
        {
            "Author Last Name": "Herrera",
            "Website": [
                None
            ]
        },
        {
            "Author Last Name": "Jensen",
            "Website": [
                "http://hannahjensen.org"
            ]
        },
        {
            "Author Last Name": "Johnson",
            "Website": [
                "https://kimberlyjohnson.net"
            ]
        },
        {
            "Author Last Name": "Medina",
            "Website": [
                None
            ]
        },
        {
            "Author Last Name": "Munoz",
            "Website": [
                "https://munoz.com"
            ]
        },
        {
            "Author Last Name": "Newman",
            "Website": [
                None
            ]
        },
        {
            "Author Last Name": "Robinson",
            "Website": [
                "https://seanrobinson.com"
            ]
        }
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['Author Last Name']) == expect_records


def test_Mathesar_Email_distinct_list_aggregation(library_ma_tables, get_uid, client):
    _ = library_ma_tables
    patrons = {
        t["name"]: t for t in client.get("/api/db/v0/tables/").json()["results"]
    }["Patrons"]
    columns = {
        c["name"]: c for c in patrons["columns"]
    }
    request_data = {
        "name": get_uid(),
        "base_table": patrons["id"],
        "initial_columns": [
            {"id": columns["First Name"]["id"], "alias": "First Name"},
            {"id": columns["Email"]["id"], "alias": "Email"},
        ],
        "display_names": {
            "First Name": "First Name",
            "Email": "Email",
        },
        "display_options": {
            "First Name": {
                display_option_origin: "First Name",
            },
            "Email": {
                display_option_origin: "Email",
            },
        },
        "transformations": [
            {
                "spec": {
                    "grouping_expressions": [
                        {
                            "input_alias": "First Name",
                            "output_alias": "First Name",
                        }
                    ],
                    "aggregation_expressions": [
                        {
                            "input_alias": "Email",
                            "output_alias": "Email",
                            "function": "distinct_aggregate_to_array",
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
        {
            "First Name": "Alexander",
            "Email": [
                "alexander.phillips38@alvarez.com"
            ]
        },
        {
            "First Name": "Andrew",
            "Email": [
                "a.vaughan@roy.com"
            ]
        },
        {
            "First Name": "Autumn",
            "Email": [
                "autumn.h19@mathews.com"
            ]
        },
        {
            "First Name": "Barry",
            "Email": [
                "b.huff@haney.com"
            ]
        },
        {
            "First Name": "Benjamin",
            "Email": [
                "b.watson33@bell-beard.biz"
            ]
        },
        {
            "First Name": "Calvin",
            "Email": [
                "c.curtis12@brown.com"
            ]
        },
        {
            "First Name": "Connor",
            "Email": [
                "c.taylor@miller.org"
            ]
        },
        {
            "First Name": "Deanna",
            "Email": [
                "deanna.s54@cook.org"
            ]
        },
        {
            "First Name": "Eduardo",
            "Email": [
                "eduardorojas13@peterson-curry.com"
            ]
        },
        {
            "First Name": "Harry",
            "Email": [
                "harry.h5@beck.net"
            ]
        },
        {
            "First Name": "Heather",
            "Email": [
                "heatherwheeler@peterson-delgado.com"
            ]
        },
        {
            "First Name": "Jason",
            "Email": [
                "jasongriffin@wilkinson.com",
                "jpeterson11@williams.com"
            ]
        },
        {
            "First Name": "Jennifer",
            "Email": [
                "jenniferw20@morrison-patton.com"
            ]
        },
        {
            "First Name": "Jesse",
            "Email": [
                "jessef88@stewart.com"
            ]
        },
        {
            "First Name": "Joshua",
            "Email": [
                "jhooper@bowers.com"
            ]
        },
        {
            "First Name": "Kathy",
            "Email": [
                "kathyb@le.org"
            ]
        },
        {
            "First Name": "Kristen",
            "Email": [
                "kwright@odonnell.com"
            ]
        },
        {
            "First Name": "Laura",
            "Email": [
                "lauras@hurley.com"
            ]
        },
        {
            "First Name": "Lori",
            "Email": [
                "l.stevens@lopez.com"
            ]
        },
        {
            "First Name": "Luke",
            "Email": [
                "luke.vang46@palmer.com"
            ]
        },
        {
            "First Name": "Mary",
            "Email": [
                "mknox45@fletcher-rodriguez.net"
            ]
        },
        {
            "First Name": "Nicole",
            "Email": [
                "nicole.jones66@dixon.org"
            ]
        },
        {
            "First Name": "Patrick",
            "Email": [
                "pshepherd13@white-bradford.info"
            ]
        },
        {
            "First Name": "Rita",
            "Email": [
                "ritab@powell.com"
            ]
        },
        {
            "First Name": "Toni",
            "Email": [
                "tevans46@thompson.net"
            ]
        },
        {
            "First Name": "Traci",
            "Email": [
                "thamilton76@smith.net"
            ]
        },
        {
            "First Name": "Tyler",
            "Email": [
                "t.gonzalez@washington.com"
            ]
        },
        {
            "First Name": "Walter",
            "Email": [
                "waltermanning@freeman.com"
            ]
        },
        {
            "First Name": "Yvonne",
            "Email": [
                "y.ho@johnson.info"
            ]
        }
    ]
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').json()['results']
    assert sorted(actual_records, key=lambda x: x['First Name']) == expect_records
