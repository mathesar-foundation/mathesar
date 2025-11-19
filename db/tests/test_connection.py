import importlib

import pytest

import db.connection as connection_module


@pytest.fixture
def reload_connection(monkeypatch):
    """Reload db.connection after changing the SSL env var."""

    def _reload(value=None):
        env_var = connection_module.SSL_MODE_ENV_VAR
        if value is None:
            monkeypatch.delenv(env_var, raising=False)
        else:
            monkeypatch.setenv(env_var, value)
        return importlib.reload(connection_module)

    yield _reload

    monkeypatch.delenv(connection_module.SSL_MODE_ENV_VAR, raising=False)
    importlib.reload(connection_module)


def test_mathesar_connection_defaults_to_disable_ssl(monkeypatch, reload_connection):
    module = reload_connection(None)
    captured = {}

    def fake_connect(*args, **kwargs):
        captured["kwargs"] = kwargs
        return "ok"

    monkeypatch.setattr(module.psycopg, "connect", fake_connect)

    assert module.mathesar_connection(dbname="test_db") == "ok"
    assert captured["kwargs"]["sslmode"] == "disable"


def test_mathesar_connection_uses_verify_mode(monkeypatch, reload_connection):
    module = reload_connection("require")
    captured = {}

    def fake_connect(*args, **kwargs):
        captured["kwargs"] = kwargs
        return "ok"

    monkeypatch.setattr(module.psycopg, "connect", fake_connect)

    assert module.mathesar_connection(dbname="test_db") == "ok"
    assert captured["kwargs"]["sslmode"] == "require"


def test_invalid_env_value_raises(monkeypatch, reload_connection):
    with pytest.raises(ValueError):
        reload_connection("foobar")

    reload_connection(None)
