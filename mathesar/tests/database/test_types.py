from mathesar.database.types import MathesarType
from mathesar.models import Database
from db.types.base import known_db_types


def _verify_type_mapping(supported_types):
    valid_ma_types = {ma_type.value for ma_type in MathesarType}
    valid_db_types = {db_type.value for db_type in known_db_types}
    seen_db_types = []
    seen_ma_types = []
    for supported_type in supported_types:
        # Verify ma types
        ma_type = supported_type['ma_type']
        assert ma_type in valid_ma_types
        # Ensure ma types are not repeated.
        assert ma_type not in seen_ma_types
        seen_ma_types.append(ma_type)

        # Verify name
        assert 'name' in supported_type

        # Verify DB types
        for db_type in supported_type['db_types']:
            assert db_type.isupper() is True
            assert db_type in valid_db_types
            # Ensure types are not repeated.
            assert db_type not in seen_db_types
            seen_db_types.append(db_type)


def test_type_mapping():
    databases = Database.objects.all()
    for database in databases:
        _verify_type_mapping(database.supported_types)
