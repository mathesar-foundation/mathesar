from mathesar.database.types import MathesarTypeIdentifier
from mathesar.models import Database


def _verify_type_mapping(supported_types):
    valid_identifiers = [identifier.value for identifier in MathesarTypeIdentifier]
    seen_types = []
    seen_identifiers = []
    for supported_type in supported_types:
        # Verify identifiers
        identifier = supported_type['identifier']
        assert identifier in valid_identifiers
        # Ensure identifiers are not repeated.
        assert identifier not in seen_identifiers
        seen_identifiers.append(identifier)

        # Verify name
        assert 'name' in supported_type

        # Verify DB types
        for db_type in supported_type['db_types']:
            assert db_type.isupper() is True
            # Ensure types are not repeated.
            assert db_type not in seen_types
            seen_types.append(identifier)


def test_type_mapping():
    databases = Database.objects.all()
    for database in databases:
        _verify_type_mapping(database.supported_types)
