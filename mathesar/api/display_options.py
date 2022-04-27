from mathesar.database.types import UIType

DISPLAY_OPTIONS_BY_UI_TYPE = {
    UIType.BOOLEAN:
        {
            "options": [{"name": "input", "type": "string",
                         "enum": ['dropdown', 'checkbox']},
                        {'name': "custom_labels", "type": "object",
                         "items": [{"name": "TRUE", "type": "string"},
                                   {'name': "FALSE", "type": "string"}]}]

        },
    UIType.NUMBER:
        {
            "options": [{"name": "show_as_percentage", "type": "boolean"},
                        {"name": "locale", "type": "string"}]
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
            "options": [{"name": "format", "type": "string"}]
        }
}
