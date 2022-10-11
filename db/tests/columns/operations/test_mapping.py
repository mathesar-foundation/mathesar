from db.columns.utils import find_match
from db.types.base import PostgresType

def test_mapping_suggestions_perfect_map(engine):
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
