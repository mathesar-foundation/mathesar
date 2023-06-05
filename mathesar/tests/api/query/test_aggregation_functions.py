display_option_origin = "display_option_origin"


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
