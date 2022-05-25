from mathesar.database.types import UIType
from mathesar.models import Database
from db.types.base import known_db_types


def _verify_type_mapping(supported_ui_types):
    valid_ui_types = {ui_type for ui_type in UIType}
    valid_db_types = {db_type for db_type in known_db_types}
    seen_db_types = []
    seen_ui_types = []
    for ui_type in supported_ui_types:
        # Verify ui types
        assert ui_type in valid_ui_types
        # Ensure ui types are not repeated.
        assert ui_type not in seen_ui_types
        seen_ui_types.append(ui_type)

        # Verify id
        assert hasattr(ui_type, 'id')
        assert isinstance(ui_type.display_name, str)

        # Verify display_name
        assert hasattr(ui_type, 'display_name')
        assert isinstance(ui_type.display_name, str)

        # Verify DB types
        assert hasattr(ui_type, 'db_types')
        for db_type in ui_type.db_types:
            assert db_type in valid_db_types
            # Ensure types are not repeated.
            assert db_type not in seen_db_types
            seen_db_types.append(db_type)


def test_type_mapping():
    databases = Database.objects.all()
    for database in databases:
        _verify_type_mapping(database.supported_ui_types)
