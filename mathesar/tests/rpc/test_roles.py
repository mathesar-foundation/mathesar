"""
This file tests the roles RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from contextlib import contextmanager

from mathesar.rpc import roles
from mathesar.models.users import User


def test_roles_list(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username=_username, password=_password)

    @contextmanager
    def mock_connect(database_id, user):
        if database_id == _database_id and user.username == _username:
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_list_roles(conn):
        return [
            {
                'oid': '10',
                'name': 'mathesar',
                'login': True,
                'super': True,
                'members': [{'oid': 2573031, 'admin': False}],
                'inherits': True,
                'create_db': True,
                'create_role': True,
                'description': None
            },
            {
                'oid': '2573031',
                'name': 'inherit_msar',
                'login': True,
                'super': False,
                'members': None,
                'inherits': True,
                'create_db': False,
                'create_role': False,
                'description': None
            },
            {
                'oid': '2573189',
                'name': 'nopriv',
                'login': False,
                'super': False,
                'members': None,
                'inherits': True,
                'create_db': False,
                'create_role': False,
                'description': None
            },
        ]

    monkeypatch.setattr(roles.base, 'connect', mock_connect)
    monkeypatch.setattr(roles.base, 'list_roles', mock_list_roles)
    roles.list_(database_id=_database_id, request=request)


def test_roles_add(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username=_username, password=_password)

    @contextmanager
    def mock_connect(database_id, user):
        if database_id == _database_id and user.username == _username:
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_create_role(rolename, password, login, conn):
        if (
            rolename != _username
            or password != _password
        ):
            raise AssertionError('incorrect parameters passed')
        return {
            'oid': '2573190',
            'name': 'alice',
            'login': False,
            'super': False,
            'members': None,
            'inherits': True,
            'create_db': False,
            'create_role': False,
            'description': None
        }

    monkeypatch.setattr(roles.base, 'connect', mock_connect)
    monkeypatch.setattr(roles.base, 'create_role', mock_create_role)
    roles.add(rolename=_username, database_id=_database_id, password=_password, login=True, request=request)


def test_get_current_role(rf, monkeypatch):
    _username = 'alice'
    _password = 'pass1234'
    _database_id = 2
    request = rf.post('/api/rpc/v0/', data={})
    request.user = User(username=_username, password=_password)

    @contextmanager
    def mock_connect(database_id, user):
        if database_id == _database_id and user.username == _username:
            try:
                yield True
            finally:
                pass
        else:
            raise AssertionError('incorrect parameters passed')

    def mock_get_current_role(conn):
        return {
            "current_role": {
                'oid': '2573031',
                'name': 'inherit_msar',
                'login': True,
                'super': False,
                'members': None,
                'inherits': True,
                'create_db': False,
                'create_role': False,
                'description': None
            },
            "parent_roles": [
                {
                    'oid': '10',
                    'name': 'mathesar',
                    'login': True,
                    'super': True,
                    'members': [{'oid': 2573031, 'admin': False}],
                    'inherits': True,
                    'create_db': True,
                    'create_role': True,
                    'description': None
                }
            ]
        }
    monkeypatch.setattr(roles.base, 'connect', mock_connect)
    monkeypatch.setattr(roles.base, 'get_current_role_from_db', mock_get_current_role)
    roles.get_current_role(database_id=_database_id, request=request)
