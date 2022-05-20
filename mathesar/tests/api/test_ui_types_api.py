from mathesar.api.display_options import DISPLAY_OPTIONS_BY_UI_TYPE
from mathesar.models import Database
from mathesar.reflection import reflect_db_objects
from mathesar.database.types import get_ui_type_from_id, UIType
from db.types.base import PostgresType, MathesarCustomType


def test_type_list(client, test_db_name):
    database = Database.objects.get(name=test_db_name)

    response = client.get(f'/api/ui/v0/databases/{database.id}/types/')
    response_data = response.json()
    assert response.status_code == 200
    assert len(response_data) == len(database.supported_ui_types)
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
            "identifier": UIType.EMAIL.id,
            "name": "Email",
            "db_types": set([
                MathesarCustomType.EMAIL.id,
            ]),
            'display_options': None
        },
        {
            "identifier": UIType.MONEY.id,
            "name": "Money",
            "db_types": set([
                PostgresType.MONEY.id,
                MathesarCustomType.MULTICURRENCY_MONEY.id,
                MathesarCustomType.MATHESAR_MONEY.id,
            ]),
            'display_options': DISPLAY_OPTIONS_BY_UI_TYPE.get(UIType.MONEY)
        },
        {
            "identifier": UIType.URI.id,
            "name": "URI",
            "db_types": set([
                MathesarCustomType.URI.id,
            ]),
            'display_options': None
        },
    ]
    reflect_db_objects()
    default_database = Database.objects.get(name=test_db_name)

    response = client.get(f'/api/ui/v0/databases/{default_database.id}/types/')
    assert response.status_code == 200
    actual_custom_types = response.json()

    for actual_custom_type in actual_custom_types:
        # Treat JSON lists as sets
        actual_custom_type['db_types'] = set(actual_custom_type['db_types'])

    for custom_type in expected_custom_types:
        assert custom_type in actual_custom_types
