import pytest
from rest_framework.test import APIClient

@pytest.fixture
def library_ma_tables(db_table_to_dj_table, library_db_tables):
    return {
        table_name: db_table_to_dj_table(db_table)
        for table_name, db_table
        in library_db_tables.items()
    }


@pytest.fixture
def create_overdue_books_query(library_ma_tables, get_uid):
    client = APIClient()
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
                "id": 34,
                "alias": "Book Title",
                "jp_path": [
                    [
                        checkouts.get_column_by_name("Item").id,
                        items.get_column_by_name("id").id,
                    ],
                    [
                        items.get_column_by_name("Publication").id,
                        publications.get_column_by_name("id").id,
                    ]
                ]
            },
        ],
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 201
    return response



def test_potato(create_overdue_books_query):
    assert create_overdue_books_query.status_code == 201




# {
#     "schema": 2,
#     "created_at": "2022-08-22T10:12:24.561380Z",
#     "updated_at": "2022-08-22T10:12:24.561408Z",
#     "name": "overdue report trois",
#     "initial_columns": [
#         {
#             "id": 44,
#             "alias": "Checkout id"
#         },
#         {
#             "id": 47,
#             "alias": "Checkout Time"
#         },
#         {
#             "id": 48,
#             "alias": "Due Date"
#         },
#         {
#             "id": 49,
#             "alias": "Check In Time"
#         },
#         {
#             "id": 57,
#             "alias": "Patron Email",
#             "display_name": "Patron Email",
#             "jp_path": [
#                 [
#                     46,
#                     54
#                 ]
#             ]
#         },
#         {
#             "id": 34,
#             "alias": "Book Title",
#             "jp_path": [
#                 [
#                     45,
#                     50
#                 ],
#                 [
#                     51,
#                     31
#                 ]
#             ]
#         },
#         {
#             "id": 35,
#             "alias": "Book ISBN",
#             "jp_path": [
#                 [
#                     45,
#                     50
#                 ],
#                 [
#                     51,
#                     31
#                 ]
#             ]
#         }
#     ],
#     "transformations": [
#         {
#             "spec": {
#                 "lesser": [
#                     {
#                         "column_name": [
#                             "Due Date"
#                         ]
#                     },
#                     {
#                         "literal": [
#                             "2022-08-18"
#                         ]
#                     }
#                 ]
#             },
#             "type": "filter"
#         },
#         {
#             "spec": {
#                 "empty": [
#                     {
#                         "column_name": [
#                             "Check In Time"
#                         ]
#                     }
#                 ]
#             },
#             "type": "filter"
#         },
#         {
#             "spec": {
#                 "grouping_expressions": [
#                     {
#                         "input_alias": "Patron Email"
#                     }
#                 ],
#                 "aggregation_expressions": [
#                     {
#                         "input_alias": "Book Title",
#                         "output_alias": "Title List",
#                         "function": "aggregate_to_array"
#                     }
#                 ]
#             },
#             "type": "summarize",
#             "display_names": {
#                 "Title List": "Titlez"
#             }
#         }
#     ],
#     "display_options": null,
#     "base_table": 11
# }
