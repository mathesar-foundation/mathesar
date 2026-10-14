import json
import logging
import os

import yaml


logger = logging.getLogger(__name__)


def load_login_page_text_config(env_value=None, config_file=None):
    raw_config = _read_raw_config(env_value, config_file)
    return _normalize_config(raw_config)


def resolve_login_page_text(config, language_code, default_heading):
    config = config if isinstance(config, dict) else {}
    translations = config.get("translations", {})
    translations = translations if isinstance(translations, dict) else {}

    text_sources = []
    for locale in _locale_candidates(language_code):
        locale_config = translations.get(locale)
        if isinstance(locale_config, dict):
            text_sources.append(locale_config)
    text_sources.append(config)

    heading = _first_text_value(text_sources, "heading")
    body = _first_text_value(text_sources, "body")
    return {
        "heading": heading or default_heading,
        "body": body,
    }


def _read_raw_config(env_value=None, config_file=None):
    if env_value and env_value.strip():
        try:
            return json.loads(env_value) or {}
        except Exception:
            logger.exception("Failed to parse login page text config env value as JSON")
            return {}
    try:
        if config_file and os.path.exists(config_file):
            with open(config_file, "rb") as f:
                return yaml.full_load(f) or {}
    except Exception:
        logger.exception("Failed to load login page text config file %s", config_file)
    return {}


def _normalize_config(raw_config):
    if not raw_config:
        return {}
    if not isinstance(raw_config, dict):
        logger.warning("Login page text config must be an object; ignoring config.")
        return {}

    config = _normalize_text_fields(raw_config)
    translations = raw_config.get("translations")
    if translations is not None:
        normalized_translations = _normalize_translations(translations)
        if normalized_translations:
            config["translations"] = normalized_translations
    return config


def _normalize_translations(translations):
    if not isinstance(translations, dict):
        logger.warning("Login page text config translations must be an object.")
        return {}

    normalized = {}
    for locale, locale_config in translations.items():
        if not isinstance(locale, str) or not isinstance(locale_config, dict):
            continue
        normalized_locale = _normalize_locale(locale)
        normalized_locale_config = _normalize_text_fields(locale_config)
        if normalized_locale and normalized_locale_config:
            normalized[normalized_locale] = normalized_locale_config
    return normalized


def _normalize_text_fields(raw_config):
    normalized = {}
    for field in ("heading", "body"):
        value = raw_config.get(field)
        if isinstance(value, str) and value.strip():
            normalized[field] = value
    return normalized


def _locale_candidates(language_code):
    normalized = _normalize_locale(language_code)
    if not normalized:
        return []
    candidates = [normalized]
    base_language = normalized.split("-", 1)[0]
    if base_language != normalized:
        candidates.append(base_language)
    return candidates


def _normalize_locale(language_code):
    if not isinstance(language_code, str):
        return ""
    return language_code.strip().lower().replace("_", "-")


def _first_text_value(text_sources, field):
    for source in text_sources:
        value = source.get(field)
        if isinstance(value, str) and value.strip():
            return value
    return None
