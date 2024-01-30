import json
from importlib import resources as impresources
from mathesar.database.types import UIType
from mathesar import data


def _money_display_options_schema():
    try:
        inp_file = (impresources.files(data) / 'currency_info.json')
        with inp_file.open("rb") as f:  # or "rt" as text file with universal newlines
            currency_info = json.load(f)
    except AttributeError:
        # Python < PY3.9, fall back to method deprecated in PY3.11.
        currency_info = json.load(impresources.open_text(data, 'currency_info.json'))
    currency_codes = list(currency_info.keys())
    return {
        "options": [
            {"name": "currency_code", "type": "string", "enum": currency_codes},
            {
                "name": "currency_details",
                "type": "object",
                "items": [
                    {"name": "symbol", "type": "string"},
                    {"name": "symbol_location", "type": "number", "enum": [1, -1]},
                    {"name": "decimal_symbol", "type": "string", "enum": [",", "."]},
                    {"name": "digit_grouping", "type": "array"},
                    {"name": "digit_symbol", "type": "string", "enum": [",", ".", " "]}
                ]
            }]
    }


DISPLAY_OPTIONS_BY_UI_TYPE = {
    UIType.BOOLEAN:
    {
        "options": [
            {
                "name": "input", "type": "string",
                "enum": ['dropdown', 'checkbox']
            },
            {
                'name': "custom_labels", "type": "object",
                "items": [
                    {"name": "TRUE", "type": "string"},
                    {'name': "FALSE", "type": "string"}
                ]
            }
        ]

    },
    UIType.NUMBER:
    {
        "options": [
            {
                "name": "show_as_percentage",
                "type": "string",
                "enum": ['dropdown', 'checkbox']
            },
            {
                "name": "use_grouping",
                "type": "string",
                "enum": ['true', 'false', 'auto']
            },
            {
                "name": "minimum_fraction_digits",
                "type": "number",
            },
            {
                "name": "maximum_fraction_digits",
                "type": "number",
            },
            {
                "name": "locale",
                "type": "string"
            }
        ]
    },
    UIType.DATETIME:
    {
        "options": [{"name": "format", "type": "string"}]
    },
    UIType.TIME:
    {
        "options": [{"name": "format", "type": "string"}]
    },
    UIType.DATE:
    {
        "options": [{"name": "format", "type": "string"}]
    },
    UIType.DURATION:
    {
        "options": [
            {"name": "min", "type": "string"},
            {"name": "max", "type": "string"},
            {"name": "show_units", "type": "boolean"},
        ]
    },
    UIType.MONEY: _money_display_options_schema(),
}
