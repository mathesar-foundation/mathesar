import json
import pytest

from config.sso_config import SSOConfig, load_sso_config, parse_sso_config


def _oidc_provider(**overrides):
    base = {
        "provider_name": "MyIdp",
        "client_id": "cid",
        "secret": "shh",
        "server_url": "https://idp.example/.well-known",
    }
    base.update(overrides)
    return base


def _github_provider(**overrides):
    base = {"type": "github", "client_id": "cid", "secret": "shh"}
    base.update(overrides)
    return base


@pytest.mark.parametrize("raw", [None, {}, {"version": 1}])
def test_parse_empty_returns_empty(raw):
    result = parse_sso_config(raw)
    assert result == SSOConfig()


def test_parse_v1_oidc_provider():
    raw = {
        "version": 1,
        "oidc_providers": {"primary": _oidc_provider()},
    }
    result = parse_sso_config(raw)
    assert result.oidc_apps == [{
        "provider_id": "myidp",
        "name": "myidp",
        "client_id": "cid",
        "secret": "shh",
        "settings": {"server_url": "https://idp.example/.well-known"},
    }]
    assert result.github_apps == []
    assert result.allowed_email_domains == {"myidp": []}


def test_parse_v1_defaults_version_to_1():
    raw = {"oidc_providers": {"primary": _oidc_provider()}}
    assert parse_sso_config(raw).oidc_apps[0]["provider_id"] == "myidp"


def test_parse_v2_mixed_providers():
    raw = {
        "version": 2,
        "providers": {
            "idp": {"type": "oidc", **_oidc_provider(provider_name="Okta")},
            "gh": _github_provider(),
        },
    }
    result = parse_sso_config(raw)
    assert [a["provider_id"] for a in result.oidc_apps] == ["okta"]
    assert [a["provider_id"] for a in result.github_apps] == ["github"]
    assert set(result.allowed_email_domains) == {"okta", "github"}


def test_parse_v2_unknown_type_skipped():
    raw = {
        "version": 2,
        "providers": {
            "bogus": {"type": "saml", "client_id": "x", "secret": "y"},
            "gh": _github_provider(),
        },
    }
    result = parse_sso_config(raw)
    assert result.oidc_apps == []
    assert len(result.github_apps) == 1


def test_parse_unknown_version_returns_empty():
    raw = {"version": 99, "providers": {"gh": _github_provider()}}
    assert parse_sso_config(raw) == SSOConfig()


@pytest.mark.parametrize("missing", ["provider_name", "client_id", "secret", "server_url"])
def test_oidc_missing_required_field_dropped(missing):
    raw = {"version": 1, "oidc_providers": {"p": _oidc_provider(**{missing: None})}}
    assert parse_sso_config(raw).oidc_apps == []


@pytest.mark.parametrize("missing", ["client_id", "secret"])
def test_github_missing_required_field_dropped(missing):
    raw = {
        "version": 2,
        "providers": {"gh": _github_provider(**{missing: None})},
    }
    assert parse_sso_config(raw).github_apps == []


def test_allowed_email_domains_string_wrapped_in_list():
    raw = {
        "version": 1,
        "oidc_providers": {"p": _oidc_provider(allowed_email_domains="example.com")},
    }
    assert parse_sso_config(raw).allowed_email_domains == {"myidp": ["example.com"]}


def test_allowed_email_domains_list_passthrough():
    raw = {
        "version": 1,
        "oidc_providers": {
            "p": _oidc_provider(allowed_email_domains=["a.com", "b.com"]),
        },
    }
    assert parse_sso_config(raw).allowed_email_domains == {"myidp": ["a.com", "b.com"]}


def test_default_pg_role_valid_recorded():
    raw = {
        "version": 1,
        "oidc_providers": {"p": _oidc_provider(default_pg_role={
            "db1": {"name": "mydb", "host": "h", "port": 5432, "role": "r"},
        })},
    }
    role_map = parse_sso_config(raw).default_pg_role_map
    assert role_map["myidp"] == [
        {"db_name": "mydb", "host": "h", "port": 5432, "role_name": "r"},
    ]


def test_default_pg_role_missing_field_skipped():
    raw = {
        "version": 1,
        "oidc_providers": {"p": _oidc_provider(default_pg_role={
            "bad": {"name": "mydb", "port": 5432, "role": "r"},  # no host
            "good": {"name": "mydb", "host": "h", "port": 5432, "role": "r"},
        })},
    }
    role_map = parse_sso_config(raw).default_pg_role_map
    assert len(role_map["myidp"]) == 1
    assert role_map["myidp"][0]["host"] == "h"


def test_load_from_env_value():
    raw = {"version": 1, "oidc_providers": {"p": _oidc_provider()}}
    result = load_sso_config(env_value=json.dumps(raw))
    assert result.oidc_apps[0]["provider_id"] == "myidp"


def test_load_invalid_json_returns_empty():
    assert load_sso_config(env_value="not-json") == SSOConfig()


def test_load_env_empty_falls_back_to_yaml_file(tmp_path):
    yaml_file = tmp_path / "sso.yml"
    yaml_file.write_text(
        "version: 1\n"
        "oidc_providers:\n"
        "  p:\n"
        "    provider_name: FromYaml\n"
        "    client_id: cid\n"
        "    secret: shh\n"
        "    server_url: https://idp.example/.well-known\n"
    )
    result = load_sso_config(env_value=None, config_file=str(yaml_file))
    assert result.oidc_apps[0]["provider_id"] == "fromyaml"


def test_load_env_value_takes_precedence_over_file(tmp_path):
    yaml_file = tmp_path / "sso.yml"
    yaml_file.write_text("version: 1\noidc_providers:\n  p:\n    provider_name: FromYaml\n")
    raw = {"version": 1, "oidc_providers": {"p": _oidc_provider()}}
    result = load_sso_config(env_value=json.dumps(raw), config_file=str(yaml_file))
    assert result.oidc_apps[0]["provider_id"] == "myidp"


def test_load_missing_file_returns_empty(tmp_path):
    assert load_sso_config(config_file=str(tmp_path / "nope.yml")) == SSOConfig()
