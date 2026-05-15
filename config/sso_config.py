from collections import defaultdict
from dataclasses import dataclass, field
import json
import logging
import os
import yaml


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SSOConfig:
    oidc_apps: list = field(default_factory=list)
    github_apps: list = field(default_factory=list)
    allowed_email_domains: dict = field(default_factory=dict)
    default_pg_role_map: dict = field(default_factory=lambda: defaultdict(list))


def load_sso_config(env_value=None, config_file=None):
    return parse_sso_config(_read_raw(env_value, config_file))


def parse_sso_config(raw):
    if not raw:
        return SSOConfig()
    try:
        entries = list(_provider_entries(raw))
    except Exception:
        logger.exception("Failed to parse SSO config")
        return SSOConfig()
    role_map = defaultdict(list)
    for entry in entries:
        if entry["default_pg_role"]:
            role_map[entry["provider_key"]].extend(entry["default_pg_role"])
    return SSOConfig(
        oidc_apps=[e["app"] for e in entries if e["kind"] == "oidc"],
        github_apps=[e["app"] for e in entries if e["kind"] == "github"],
        allowed_email_domains={
            e["provider_key"]: e["allowed_email_domains"] for e in entries
        },
        default_pg_role_map=role_map,
    )


def _read_raw(env_value, config_file):
    raw = {}
    try:
        raw = json.loads(env_value or "{}") or {}
    except Exception:
        logger.exception("Failed to parse SSO config env value as JSON")
    try:
        if not raw and config_file and os.path.exists(config_file):
            with open(config_file, "rb") as f:
                raw = yaml.full_load(f) or {}
    except Exception:
        logger.exception("Failed to load SSO config file %s", config_file)
    return raw


def _provider_entries(raw):
    version = raw.get("version", 1)
    if version == 1:
        for provider in (raw.get("oidc_providers") or {}).values():
            if not provider:
                continue
            entry = _oidc_entry(provider)
            if entry:
                yield entry
    elif version == 2:
        for provider in (raw.get("providers") or {}).values():
            if not provider:
                continue
            entry = _entry_for(provider)
            if entry:
                yield entry
    else:
        logger.warning("SSO config: unknown version '%s'; SSO not loaded.", version)


def _entry_for(provider):
    provider_type = provider.get("type")
    if provider_type == "oidc":
        return _oidc_entry(provider)
    if provider_type == "github":
        return _github_entry(provider)
    logger.warning("SSO config: unknown provider type '%s'; skipping entry.", provider_type)
    return None


def _oidc_entry(provider):
    provider_name = provider.get("provider_name")
    client_id = provider.get("client_id")
    secret = provider.get("secret")
    server_url = provider.get("server_url")
    if not all([provider_name, client_id, secret, server_url]):
        return None
    provider_key = provider_name.lower()
    return {
        "kind": "oidc",
        "provider_key": provider_key,
        "app": {
            "provider_id": provider_key,
            "name": provider_key,
            "client_id": client_id,
            "secret": secret,
            "settings": {"server_url": server_url},
        },
        "allowed_email_domains": _normalize_domains(provider.get("allowed_email_domains", [])),
        "default_pg_role": _normalize_pg_role(provider.get("default_pg_role", {})),
    }


def _github_entry(provider):
    client_id = provider.get("client_id")
    secret = provider.get("secret")
    if not all([client_id, secret]):
        return None
    return {
        "kind": "github",
        "provider_key": "github",
        "app": {
            "provider_id": "github",
            "name": "github",
            "client_id": client_id,
            "secret": secret,
        },
        "allowed_email_domains": _normalize_domains(provider.get("allowed_email_domains", [])),
        "default_pg_role": _normalize_pg_role(provider.get("default_pg_role", {})),
    }


def _normalize_domains(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return [value]
    return []


def _normalize_pg_role(default_pg_role):
    roles = []
    for role_info in (default_pg_role or {}).values():
        if not role_info:
            continue
        db_name = role_info.get("name")
        host = role_info.get("host")
        port = role_info.get("port")
        role_name = role_info.get("role")
        if all([db_name, host, port, role_name]):
            roles.append({
                "db_name": db_name,
                "host": host,
                "port": port,
                "role_name": role_name,
            })
    return roles
