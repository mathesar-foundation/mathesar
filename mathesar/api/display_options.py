from mathesar.database.types import MathesarTypeIdentifier

DISPLAY_OPTIONS_BY_TYPE_IDENTIFIER = {
    MathesarTypeIdentifier.BOOLEAN.value:
        {
            "options": [{"name": "input", "type": "string",
                         "enum": ['dropdown', 'checkbox']},
                        {'name': "custom_labels", "type": "object",
                         "items": [{"name": "TRUE", "type": "string"},
                                   {'name': "FALSE", "type": "string"}]}]

        },
    MathesarTypeIdentifier.NUMBER.value:
        {
            "options": [{"name": "show_as_percentage", "type": "boolean"},
                        {"name": "locale", "type": "string"}]
        },
    MathesarTypeIdentifier.DATETIME.value:
        {
            "options": [{"name": "format", "type": "string"}]
        },
    MathesarTypeIdentifier.DURATION.value:
        {
            "options": [{"name": "format", "type": "string"}]
        }
}
