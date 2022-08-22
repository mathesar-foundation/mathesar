import pytest


@pytest.fixture
def library_ma_tables(db_table_to_dj_table, library_db_tables):
    return {
        table_name: db_table_to_dj_table(db_table)
        for table_name, db_table
        in library_db_tables.items()
    }


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
    query_id = create_overdue_books_query.data['id']
    expect_response_data = (
        {
            'alias': 'email',
            'display_name': 'Patron Email',
            'type': 'mathesar_types.email',
            'type_options': None,
            'display_options': None
        }, {
            'alias': 'Title List',
            'display_name': 'Titles',
            'type': '_array',
            'type_options': None,
            'display_options': None
        }
    )
    actual_response_data = client.get(f'/api/db/v0/queries/{query_id}/columns/').data
    assert actual_response_data == expect_response_data
    return query_id


def test_overdue_books_scenario(check_overdue_books_columns, client):
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
    actual_records = client.get(f'/api/db/v0/queries/{query_id}/records/').data['results']
    assert sorted(actual_records, key=lambda x: x['email']) == expect_records
