from mathesar.api.display_options import DISPLAY_OPTIONS_BY_UI_TYPE
from mathesar.models import Database
from mathesar.reflection import reflect_db_objects
from mathesar.database.types import get_ui_type_from_id


def test_type_list(client, test_db_name):
    database = Database.objects.get(name=test_db_name)

    response = client.get(f'/api/ui/v0/databases/{database.id}/types/')
    response_data = response.json()
    assert response.status_code == 200
    assert len(response_data) == len(database.supported_types)
    for supported_type in response_data:
        assert all([key in supported_type for key in ['identifier', 'name', 'db_types', 'display_options']])
        found_display_options = supported_type.get('display_options')
        ui_type = get_ui_type_from_id(supported_type.get('identifier'))
        assert ui_type is not None
        expected_display_options = DISPLAY_OPTIONS_BY_UI_TYPE.get(ui_type)
        assert found_display_options == expected_display_options


def test_database_types_installed(client, test_db_name):
    expected_custom_types = [
        {
            "identifier": "email",
            "name": "Email",
            "db_types": [
                "MATHESAR_TYPES.EMAIL"
            ],
            "filters": None,
            'display_options': None
        },
        {
            "identifier": "money",
            "name": "Money",
            "db_types": [
                "MONEY",
                "MATHESAR_TYPES.MATHESAR_MONEY",
                "MATHESAR_TYPES.MULTICURRENCY_MONEY",
            ],
            "filters": None,
            'display_options': None
        },
        {
            "identifier": "uri",
            "name": "URI",
            "db_types": [
                "MATHESAR_TYPES.URI"
            ],
            "filters": None,
            'display_options': None
        },
    ]
    reflect_db_objects()
    default_database = Database.objects.get(name=test_db_name)

    response = client.get(f'/api/ui/v0/databases/{default_database.id}/types/').json()
    assert all([type_data in response for type_data in expected_custom_types])
