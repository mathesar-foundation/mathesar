from db.functions.known_db_functions import known_db_functions


def test_all_functions_no_raw_func():
    """
    In DBFunction subclasses, we want to forbid raw `func` calls in the
    to_sa_expression method. The reason is that we have to ensure that
    the calls are wrapped in such a way that the return type is properly
    specified, e.g., by using `db.functions.base.sa_call_sql_function`.
    """
    for dbf in known_db_functions:
        assert 'func' not in dbf.to_sa_expression.__code__.co_names
