import json

from config.login_page_config import (
    load_login_page_text_config,
    resolve_login_page_text,
)


def test_login_page_text_config_defaults_to_empty_when_unset(tmp_path):
    config_file = tmp_path / "login_page.yml"

    assert load_login_page_text_config(config_file=config_file) == {}


def test_login_page_text_config_loads_yaml_file(tmp_path):
    config_file = tmp_path / "login_page.yml"
    config_file.write_text(
        "heading: Welcome to your Mathesar workspace\n"
        "body: Log in to continue working with your data.\n"
        "translations:\n"
        "  es:\n"
        "    heading: Bienvenido a tu espacio de trabajo de Mathesar\n"
        "    body: Inicia sesión para seguir trabajando con tus datos.\n"
    )

    assert load_login_page_text_config(config_file=config_file) == {
        "heading": "Welcome to your Mathesar workspace",
        "body": "Log in to continue working with your data.",
        "translations": {
            "es": {
                "heading": "Bienvenido a tu espacio de trabajo de Mathesar",
                "body": "Inicia sesión para seguir trabajando con tus datos.",
            },
        },
    }


def test_login_page_text_config_env_json_takes_precedence_over_file(tmp_path):
    config_file = tmp_path / "login_page.yml"
    config_file.write_text("heading: File heading\n")
    env_value = json.dumps({"heading": "Env heading"})

    assert load_login_page_text_config(
        env_value=env_value, config_file=config_file
    ) == {"heading": "Env heading"}


def test_login_page_text_config_empty_env_value_loads_file(tmp_path):
    config_file = tmp_path / "login_page.yml"
    config_file.write_text("heading: File heading\n")

    assert load_login_page_text_config(
        env_value="", config_file=config_file
    ) == {"heading": "File heading"}


def test_login_page_text_config_invalid_json_falls_back_safely(tmp_path):
    config_file = tmp_path / "login_page.yml"
    config_file.write_text("heading: File heading\n")

    assert load_login_page_text_config(
        env_value="{not-json}", config_file=config_file
    ) == {}


def test_login_page_text_config_malformed_shapes_fall_back_safely(tmp_path):
    config_file = tmp_path / "login_page.yml"
    config_file.write_text("- not\n- an\n- object\n")

    assert load_login_page_text_config(config_file=config_file) == {}
    assert load_login_page_text_config(
        env_value=json.dumps({"translations": ["not", "an", "object"]})
    ) == {}


def test_login_page_text_config_empty_string_fields_are_absent():
    env_value = json.dumps({
        "heading": "",
        "body": " ",
        "translations": {
            "es": {
                "heading": "",
                "body": "Regístrate o inicia sesión.",
            },
        },
    })

    assert load_login_page_text_config(env_value=env_value) == {
        "translations": {
            "es": {
                "body": "Regístrate o inicia sesión.",
            },
        },
    }


def test_resolve_login_page_text_uses_default_heading_without_custom_text():
    assert resolve_login_page_text({}, "es", "Log in to Mathesar") == {
        "heading": "Log in to Mathesar",
        "body": None,
    }


def test_resolve_login_page_text_uses_exact_locale_first():
    config = {
        "heading": "Welcome to your Mathesar workspace",
        "body": "Sign up or log in.",
        "translations": {
            "es": {
                "heading": "Bienvenido a tu espacio de trabajo de Mathesar",
                "body": "Regístrate o inicia sesión.",
            },
        },
    }

    assert resolve_login_page_text(config, "es", "Log in to Mathesar") == {
        "heading": "Bienvenido a tu espacio de trabajo de Mathesar",
        "body": "Regístrate o inicia sesión.",
    }


def test_resolve_login_page_text_uses_base_language_fallback():
    config = {
        "heading": "Welcome to your Mathesar workspace",
        "translations": {
            "es": {
                "heading": "Bienvenido a tu espacio de trabajo de Mathesar",
            },
        },
    }

    assert resolve_login_page_text(config, "es-mx", "Log in to Mathesar") == {
        "heading": "Bienvenido a tu espacio de trabajo de Mathesar",
        "body": None,
    }


def test_resolve_login_page_text_missing_localized_body_uses_top_level_body():
    config = {
        "heading": "Welcome to your Mathesar workspace",
        "body": "Sign up or log in.",
        "translations": {
            "es": {
                "heading": "Bienvenido a tu espacio de trabajo de Mathesar",
            },
        },
    }

    assert resolve_login_page_text(config, "es", "Log in to Mathesar") == {
        "heading": "Bienvenido a tu espacio de trabajo de Mathesar",
        "body": "Sign up or log in.",
    }
