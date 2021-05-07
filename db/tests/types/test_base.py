import pytest
from db import types
from db.engine import _add_custom_types_to_engine
from db.types import base


@pytest.fixture
def engine_with_types(engine):
    _add_custom_types_to_engine(engine)
    return engine


def test_get_alter_column_types_with_standard_engine(engine):
    type_dict = base.get_supported_alter_column_types(engine)
    assert len(type_dict) > 0
    assert all([type_ not in type_dict for type_ in types.CUSTOM_TYPE_DICT])


def test_get_alter_column_types_with_custom_engine(engine_with_types):
    type_dict = base.get_supported_alter_column_types(engine_with_types)
    assert all(
        [
            type_ in type_dict.values()
            for type_ in types.CUSTOM_TYPE_DICT.values()
        ]
    )
