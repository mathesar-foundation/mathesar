display_option_origin = "display_option_origin"


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
