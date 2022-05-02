from unittest.mock import patch

from db.engine import create_engine
from db.schemas import utils as schema_utils


def test_get_mathesar_schemas():
    engine = create_engine("postgresql://")
    with patch.object(schema_utils, "get_mathesar_schemas_with_oids") as mock_schemas:
        schema_utils.get_mathesar_schemas(engine)
    mock_schemas.assert_called_once_with(engine)
