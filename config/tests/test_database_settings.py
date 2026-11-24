import runpy

import pytest


def _load_common_settings(monkeypatch, **env):
    for key in ("POSTGRES_DB", "POSTGRES_USER", "POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_SSLMODE"):
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    # Runs the module without replacing the one Django already loaded its settings from.
    return runpy.run_module("config.settings.common_settings", run_name="common_settings_under_test")


@pytest.mark.parametrize("sslmode", ["disable", "prefer", "require"])
def test_internal_database_honors_postgres_sslmode(monkeypatch, sslmode):
    loaded = _load_common_settings(
        monkeypatch,
        POSTGRES_DB="mathesar",
        POSTGRES_USER="mathesar",
        POSTGRES_HOST="localhost",
        POSTGRES_SSLMODE=sslmode,
    )
    options = loaded["DATABASES"]["default"]["OPTIONS"]
    assert options["sslmode"] == sslmode
    assert options["application_name"] == "Mathesar Django"


def test_internal_database_defaults_sslmode_to_prefer(monkeypatch):
    loaded = _load_common_settings(
        monkeypatch,
        POSTGRES_DB="mathesar",
        POSTGRES_USER="mathesar",
        POSTGRES_HOST="localhost",
    )
    assert loaded["DATABASES"]["default"]["OPTIONS"]["sslmode"] == "prefer"
