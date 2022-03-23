import json

from mathesar.database.types import MathesarTypeIdentifier


def money_display_options_schema():
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


DISPLAY_OPTIONS_BY_TYPE_IDENTIFIER = {
    MathesarTypeIdentifier.BOOLEAN.value: lambda: {
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
    MathesarTypeIdentifier.DATE.value: lambda: {"options": [{"name": "format", "type": "string"}]},
    MathesarTypeIdentifier.DATETIME.value: lambda: {"options": [{"name": "format", "type": "string"}]},
    MathesarTypeIdentifier.DURATION.value: lambda: {"options": [{"name": "format", "type": "string"}]},
    MathesarTypeIdentifier.MONEY.value: money_display_options_schema,
    MathesarTypeIdentifier.NUMBER.value: lambda: {
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
    MathesarTypeIdentifier.TIME.value: (lambda: {"options": [{"name": "format", "type": "string"}]})
}


def get_display_options_for_identifier(identifier):
    display_options_function = DISPLAY_OPTIONS_BY_TYPE_IDENTIFIER.get(identifier, None)
    if display_options_function is not None:
        return display_options_function()
    else:
        return None
