"""
This file tests the databases.base RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from unittest.mock import MagicMock

from mathesar import __version__
from mathesar.models.base import Database
from mathesar.models.users import User
from mathesar.rpc.databases import base as databases_base


def _make_mock_database():
    db = MagicMock()
    db.uninstall_sql = MagicMock()
    db.save = MagicMock()
    db.last_confirmed_sql_version = None
    return db


def test_remove_mathesar_schemas_default(monkeypatch, rf):
    request = rf.post("/api/rpc/v0/", data={})
    request.user = User(username="alice", password="pass1234")
    mock_db = _make_mock_database()
    monkeypatch.setattr(Database.objects, "get", lambda **kwargs: mock_db)

    databases_base.remove_mathesar_schemas(
        database_id=3, request=request
    )

    mock_db.uninstall_sql.assert_called_once_with(
        schemas_to_remove=['msar', '__msar'],
        strict=False,
        role_name=None,
        password=None,
    )
    assert mock_db.last_confirmed_sql_version == __version__
    mock_db.save.assert_called_once()


def test_remove_mathesar_schemas_with_remove_types(monkeypatch, rf):
    request = rf.post("/api/rpc/v0/", data={})
    request.user = User(username="alice", password="pass1234")
    mock_db = _make_mock_database()
    monkeypatch.setattr(Database.objects, "get", lambda **kwargs: mock_db)

    databases_base.remove_mathesar_schemas(
        database_id=3, remove_types=True, request=request
    )

    mock_db.uninstall_sql.assert_called_once_with(
        schemas_to_remove=['msar', '__msar', 'mathesar_types'],
        strict=False,
        role_name=None,
        password=None,
    )
    assert mock_db.last_confirmed_sql_version == __version__
    mock_db.save.assert_called_once()


def test_remove_mathesar_schemas_custom_role_and_schemas(monkeypatch, rf):
    request = rf.post("/api/rpc/v0/", data={})
    request.user = User(username="alice", password="pass1234")
    mock_db = _make_mock_database()
    monkeypatch.setattr(Database.objects, "get", lambda **kwargs: mock_db)

    databases_base.remove_mathesar_schemas(
        database_id=3,
        schemas_to_remove=['msar'],
        role_name='admin',
        password='secret',
        request=request,
    )

    mock_db.uninstall_sql.assert_called_once_with(
        schemas_to_remove=['msar'],
        strict=False,
        role_name='admin',
        password='secret',
    )
    assert mock_db.last_confirmed_sql_version == __version__
    mock_db.save.assert_called_once()
