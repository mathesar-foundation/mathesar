import json
from mathesar.database.types import UIType
from lazydict import LazyDictionary


def _money_display_options_schema():
    with open("currency_info.json", "r") as info_file:
        currency_info = json.load(info_file)
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


DISPLAY_OPTIONS_BY_UI_TYPE = LazyDictionary(
    {
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
        # NOTE: below callable will be evaluated lazily by LazyDictionary
        UIType.MONEY: _money_display_options_schema,
    }
)
