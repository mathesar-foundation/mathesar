from unittest.mock import call, patch
from sqlalchemy import create_engine
from db import schemas
from db import types


def test_get_mathesar_schemas():
    engine = create_engine("postgresql://")
    with patch.object(schemas, "get_mathesar_schemas_with_oids") as mock_schemas:
        schemas.get_mathesar_schemas(engine)
    mock_schemas.assert_called_once_with(engine)
