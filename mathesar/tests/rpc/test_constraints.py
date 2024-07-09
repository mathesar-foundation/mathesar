"""
This file tests the constraint RPC functions.

Fixtures:
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import constraints
from mathesar.models.users import User


def test_constraints_list(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 2254444
    database_id = 11

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_constaints_list(_table_oid, conn):
        if _table_oid != table_oid:
            raise AssertionError('incorrect parameters passed')
        return [
            {
                'oid': 2254567,
                'name': 'Movie Cast Map_Cast Member_fkey',
                'type': 'foreignkey',
                'columns': [4],
                'referent_table_oid': 2254492,
                'referent_columns': [1]
            },
            {
                'oid': 2254572,
                'name': 'Movie Cast Map_Movie_fkey',
                'type': 'foreignkey',
                'columns': [3],
                'referent_table_oid': 2254483,
                'referent_columns': [1]
            },
            {
                'oid': 2254544,
                'name': 'Movie Cast Map_pkey',
                'type': 'primary',
                'columns': [1],
                'referent_table_oid': 0,
                'referent_columns': None
            }
        ]
    monkeypatch.setattr(constraints, 'connect', mock_connect)
    monkeypatch.setattr(constraints, 'get_constraints_for_table', mock_constaints_list)
    expect_constraints_list = [
        {
            'oid': 2254567,
            'name': 'Movie Cast Map_Cast Member_fkey',
            'type': 'foreignkey',
            'columns': [4],
            'referent_table_oid': 2254492,
            'referent_columns': [1]
        },
        {
            'oid': 2254572,
            'name': 'Movie Cast Map_Movie_fkey',
            'type': 'foreignkey',
            'columns': [3],
            'referent_table_oid': 2254483,
            'referent_columns': [1]
        },
        {
            'oid': 2254544,
            'name': 'Movie Cast Map_pkey',
            'type': 'primary',
            'columns': [1],
            'referent_table_oid': 0,
            'referent_columns': None
        }
    ]
    actual_constraint_list = constraints.list_(table_oid=table_oid, database_id=11, request=request)
    assert actual_constraint_list == expect_constraints_list


def test_constraints_drop(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 2254444
    constraint_oid = 2254567
    database_id = 11

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_constaints_delete(_table_oid, _constraint_oid, conn):
        if _table_oid != table_oid and _constraint_oid != constraint_oid:
            raise AssertionError('incorrect parameters passed')
        return 'Movie Cast Map_Cast Member_fkey'
    monkeypatch.setattr(constraints, 'connect', mock_connect)
    monkeypatch.setattr(constraints, 'drop_constraint_via_oid', mock_constaints_delete)
    constraint_name = constraints.delete(
        table_oid=table_oid, constraint_oid=constraint_oid, database_id=11, request=request
    )
    assert constraint_name == 'Movie Cast Map_Cast Member_fkey'


def test_constraints_create(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    table_oid = 2254444
    constraint_def_list = [
        {
            'name': 'Movie Cast Map_Movie_fkey',
            'type': 'f',
            'columns': [3],
            'fkey_relation_id': 2254483,
            'fkey_columns': [1],
            'fkey_update_actions': 'a',
            'fkey_delete_action': 'a',
            'fkey_match_type': 's'
        }
    ]
    database_id = 11

    @contextmanager
    def mock_connect(_database_id, user):
        if _database_id == database_id and user.username == 'alice':
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_constaints_create(_table_oid, _constraint_def_list, conn):
        if _table_oid != table_oid and _constraint_def_list != constraint_def_list:
            raise AssertionError('incorrect parameters passed')
        return [2254833, 2254567, 2254544]
    monkeypatch.setattr(constraints, 'connect', mock_connect)
    monkeypatch.setattr(constraints, 'create_constraint', mock_constaints_create)
    constraint_oids = constraints.add(
        table_oid=table_oid, constraint_def_list=constraint_def_list, database_id=11, request=request
    )
    assert constraint_oids == [2254833, 2254567, 2254544]
