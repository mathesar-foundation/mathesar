from db.functions.known_db_functions import known_db_functions


def test_all_functions_no_raw_func():
    for dbf in known_db_functions:
        assert 'func' not in dbf.to_sa_expression.__code__.co_names
