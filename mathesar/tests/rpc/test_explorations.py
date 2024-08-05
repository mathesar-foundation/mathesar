"""
This file tests the explorations RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from mathesar.rpc import explorations
from mathesar.models.users import User
from mathesar.models.base import Database, Explorations


def test_explorations_list(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    database_id = 11

    def mock_exploration_info(_database_id):
        if _database_id != database_id:
            raise AssertionError('incorrect parameters passed')
        return [
            Explorations(
                id=2,
                database=Database(id=1),
                name='page count',
                base_table_oid=12375,
                initial_columns=[
                    {'id': 51586, 'alias': 'Items_Acquisition Date'},
                    {'id': 51598, 'alias': 'Items_id'},
                    {'id': 51572, 'alias': 'Books_Media', 'jp_path': [[51588, 51596]]},
                    {'id': 51573, 'alias': 'Books_Page Count', 'jp_path': [[51588, 51596]]}
                ],
                transformations=[
                    {'spec': {'greater': [{'column_name': ['Books_Page Count']}, {'literal': ['50']}]}, 'type': 'filter'}
                ],
                display_options=None,
                display_names={
                    'Items_id': 'Items_id',
                    'Items_Book': 'Items_Book',
                    'Books_Media': 'Books_Media',
                    'Items_Book_1': 'Items_Book_1',
                    'Books_Page Count': 'Books_Page Count',
                    'Items_Acquisition Date': 'Items_Acquisition Date'
                },
                description=None
            ),
            Explorations(
                id=3,
                database=Database(id=1),
                name='ISBN',
                base_table_oid=12356,
                initial_columns=[
                    {'id': 51594, 'alias': 'Publishers_Name'},
                    {'id': 51575, 'alias': 'Books_ISBN', 'jp_path': [[51593, 51579]]}
                ],
                transformations=[
                    {
                        'spec': {
                            'base_grouping_column': 'Publishers_Name',
                            'grouping_expressions': [
                                {'input_alias': 'Publishers_Name', 'output_alias': 'Publishers_Name_grouped'}
                            ],
                            'aggregation_expressions': [{
                                'function': 'distinct_aggregate_to_array',
                                'input_alias': 'Books_ISBN',
                                'output_alias': 'Books_ISBN_agged'}]
                        },
                        'type': 'summarize'}
                ],
                display_options=None,
                display_names={
                    'Books_ISBN': 'Books_ISBN', 'Publishers_Name': 'Publishers_Name'
                },
                description=None
            )
        ]
    monkeypatch.setattr(explorations, 'list_explorations', mock_exploration_info)
    expect_explorations_list = [
        {
            'id': 2,
            'database_id': 1,
            'name': 'page count',
            'base_table_oid': 12375,
            'initial_columns': [
                {'id': 51586, 'alias': 'Items_Acquisition Date'},
                {'id': 51598, 'alias': 'Items_id'},
                {'id': 51572, 'alias': 'Books_Media', 'jp_path': [[51588, 51596]]},
                {'id': 51573, 'alias': 'Books_Page Count', 'jp_path': [[51588, 51596]]}
            ],
            'transformations': [
                {'spec': {'greater': [{'column_name': ['Books_Page Count']}, {'literal': ['50']}]}, 'type': 'filter'}],
            'display_options': None,
            'display_names': {
                'Items_id': 'Items_id',
                'Items_Book': 'Items_Book',
                'Books_Media': 'Books_Media',
                'Items_Book_1': 'Items_Book_1',
                'Books_Page Count': 'Books_Page Count',
                'Items_Acquisition Date': 'Items_Acquisition Date'
            },
            'description': None
        },
        {
            'id': 3,
            'database_id': 1,
            'name': 'ISBN',
            'base_table_oid': 12356,
            'initial_columns': [
                {'id': 51594, 'alias': 'Publishers_Name'},
                {'id': 51575, 'alias': 'Books_ISBN', 'jp_path': [[51593, 51579]]}
            ],
            'transformations': [
                {
                    'spec': {
                        'base_grouping_column': 'Publishers_Name',
                        'grouping_expressions': [
                            {'input_alias': 'Publishers_Name', 'output_alias': 'Publishers_Name_grouped'}
                        ],
                        'aggregation_expressions': [{
                            'function': 'distinct_aggregate_to_array',
                            'input_alias': 'Books_ISBN',
                            'output_alias': 'Books_ISBN_agged'}]
                    },
                    'type': 'summarize'}
            ],
            'display_options': None,
            'display_names': {
                'Books_ISBN': 'Books_ISBN', 'Publishers_Name': 'Publishers_Name'
            },
            'description': None
        }
    ]
    actual_explorations_list = explorations.list_(database_id=11)
    assert actual_explorations_list == expect_explorations_list
