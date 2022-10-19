from db.columns.exceptions import ColumnMappingsNotFound
from db.columns.utils import find_match, is_type_casting_valid
from db.types.base import PostgresType
import pytest


def test_mapping_suggestions_perfect_match(engine):
    temp_table_col_list = [('Case Number', PostgresType.INTEGER),
                           ('Center', PostgresType.TEXT),
                           ('Patent Expiration Date', PostgresType.DATE)
                           ]

    target_table_col_list = [('Center', PostgresType.TEXT),
                             ('Case Number', PostgresType.INTEGER),
                             ('Patent Expiration Date', PostgresType.DATE)
                             ]

    match = find_match(temp_table_col_list, target_table_col_list, engine)
    expected_match = [(0, 1), (1, 0), (2, 2)]
    assert match == expected_match


def test_mapping_suggestions_case_insensitive(engine):
    temp_table_col_list = [('Case number', PostgresType.INTEGER),
                           ('center', PostgresType.TEXT),
                           ('Patent expiration Date', PostgresType.DATE)
                           ]

    target_table_col_list = [('Center', PostgresType.TEXT),
                             ('patent Expiration date', PostgresType.DATE),
                             ('case Number', PostgresType.INTEGER)
                             ]

    match = find_match(temp_table_col_list, target_table_col_list, engine)
    expected_match = [(0, 2), (1, 0), (2, 1)]
    assert match == expected_match


def test_mapping_suggestions_space_switched(engine):
    temp_table_col_list = [('Case_Number', PostgresType.INTEGER),
                           ('Patent_Expiration Date', PostgresType.DATE),
                           ('Center', PostgresType.TEXT),
                           ]

    target_table_col_list = [('Center', PostgresType.TEXT),
                             ('Case Number', PostgresType.INTEGER),
                             ('Patent Expiration_Date', PostgresType.DATE)
                             ]

    match = find_match(temp_table_col_list, target_table_col_list, engine)
    expected_match = [(0, 1), (2, 0), (1, 2)]
    assert match == expected_match


def test_mapping_suggestions_space_switched_case_insensitive(engine):
    temp_table_col_list = [('Case_number', PostgresType.INTEGER),
                           ('center', PostgresType.TEXT),
                           ('Patent Expiration Date', PostgresType.DATE)
                           ]

    target_table_col_list = [('Patent_expiration_date', PostgresType.DATE),
                             ('Center', PostgresType.TEXT),
                             ('case Number', PostgresType.INTEGER)
                             ]

    match = find_match(temp_table_col_list, target_table_col_list, engine)
    expected_match = [(0, 2), (1, 1), (2, 0)]
    assert match == expected_match


def test_mappings_suggestions_no_match(engine):
    temp_table_col_list = [('Case #', PostgresType.INTEGER),
                           ('Center', PostgresType.TEXT),
                           ('Patent-Expiration-Date', PostgresType.DATE)
                           ]

    target_table_col_list = [('Center', PostgresType.TEXT),
                             ('Case Number', PostgresType.INTEGER),
                             ('Patent Expiration Date', PostgresType.DATE)
                             ]

    with pytest.raises(ColumnMappingsNotFound):
        find_match(temp_table_col_list, target_table_col_list, engine)


def test_type_cast_validator_valid_castings(engine):
    temp_table_col_list = [('Case Number', PostgresType.INTEGER),
                           ('Center', PostgresType.CHARACTER),
                           ('Patent Expiration Date', PostgresType.DATE)
                           ]

    target_table_col_list = [('Center', PostgresType.JSON),
                             ('Case Number', PostgresType.NUMERIC),
                             ('Patent Expiration Date', PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE)
                             ]
    sorted_zip = list(zip(sorted(temp_table_col_list), sorted(target_table_col_list)))
    is_valid = is_type_casting_valid(sorted_zip, engine)
    assert is_valid is True


def test_type_cast_validator_invalid_castings(engine):
    temp_table_col_list = [('Case Number', PostgresType.JSON),
                           ('Center', PostgresType.TEXT),
                           ('Patent Expiration Date', PostgresType.DATE)
                           ]

    target_table_col_list = [('Center', PostgresType.TEXT),
                             ('Case Number', PostgresType.REAL),
                             ('Patent Expiration Date', PostgresType.DATERANGE)
                             ]
    sorted_zip = list(zip(sorted(temp_table_col_list), sorted(target_table_col_list)))
    is_valid = is_type_casting_valid(sorted_zip, engine)
    assert is_valid is False
