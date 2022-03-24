from mathesar.database.types import MathesarType

DISPLAY_OPTIONS_BY_TYPE_IDENTIFIER = {
    MathesarType.BOOLEAN.value:
        {
            "options": [{"name": "input", "type": "string",
                         "enum": ['dropdown', 'checkbox']},
                        {'name': "custom_labels", "type": "object",
                         "items": [{"name": "TRUE", "type": "string"},
                                   {'name': "FALSE", "type": "string"}]}]

        },
    MathesarType.NUMBER.value:
        {
            "options": [{"name": "show_as_percentage", "type": "boolean"},
                        {"name": "locale", "type": "string"}]
        },
    MathesarType.DATETIME.value:
        {
            "options": [{"name": "format", "type": "string"}]
        },
    MathesarType.TIME.value:
        {
            "options": [{"name": "format", "type": "string"}]
        },
    MathesarType.DATE.value:
        {
            "options": [{"name": "format", "type": "string"}]
        },
    MathesarType.DURATION.value:
        {
            "options": [{"name": "format", "type": "string"}]
        }
}
