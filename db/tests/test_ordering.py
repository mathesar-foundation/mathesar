import pytest
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError


def _list_records(conn, table_name):
    stmt = text(
        "SELECT msar.list_records_from_table(cast(:tab AS regclass), 10, 0, NULL, NULL, NULL)"
    )
    return conn.execute(stmt, {"tab": table_name}).scalar_one()


def test_circle_only_raises_no_orderable(engine_with_schema):
    engine, schema = engine_with_schema
    table = f"{schema}.circle_only"
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path TO {schema}"))
        conn.execute(text(f"CREATE TABLE {table} (c circle)"))
        with pytest.raises(ProgrammingError) as excinfo:
            _list_records(conn, table)
    sqlstate = getattr(excinfo.value.orig, "sqlstate", None) or getattr(excinfo.value.orig, "pgcode", None)
    assert sqlstate == "42P17"
    assert "Table has no orderable columns" in str(excinfo.value.orig)


def test_id_and_circle_orders_by_id(engine_with_schema):
    engine, schema = engine_with_schema
    table = f"{schema}.id_circle"
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path TO {schema}"))
        conn.execute(text(f"CREATE TABLE {table} (id serial PRIMARY KEY, c circle)"))
        conn.execute(text(f"INSERT INTO {table} (c) VALUES (circle '((0,0),1)')"))
        result = _list_records(conn, table)
    assert result["count"] == 1


def test_permission_denied_happens_before_ordering(engine_with_schema):
    engine, schema = engine_with_schema
    table = f"{schema}.circle_perm"
    role = "limited_order_role"
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path TO {schema}"))
        conn.execute(text(f"CREATE TABLE {table} (c circle)"))
        conn.execute(text(f"REVOKE ALL ON {table} FROM PUBLIC"))
        conn.execute(
            text(
                f"""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role}') THEN
                        EXECUTE 'DROP OWNED BY "{role}"';
                        EXECUTE 'DROP ROLE "{role}"';
                    END IF;
                END
                $$;
                """
            )
        )
        conn.execute(text(f"CREATE ROLE \"{role}\" LOGIN PASSWORD :pw"), {"pw": "x"})
        conn.execute(text(f"GRANT USAGE ON SCHEMA msar, __msar TO \"{role}\""))
        conn.execute(text(f"GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA msar, __msar TO \"{role}\""))
        conn.execute(text(f"GRANT USAGE ON SCHEMA {schema} TO \"{role}\""))
        try:
            conn.execute(text(f"SET ROLE \"{role}\""))
            savepoint = conn.begin_nested()
            with pytest.raises(ProgrammingError) as excinfo:
                _list_records(conn, table)
            savepoint.rollback()
        finally:
            conn.execute(text("RESET ROLE"))
            conn.execute(text(f"DROP OWNED BY \"{role}\""))
            conn.execute(text(f"DROP ROLE IF EXISTS \"{role}\""))
    sqlstate = getattr(excinfo.value.orig, "sqlstate", None) or getattr(excinfo.value.orig, "pgcode", None)
    assert sqlstate == "42501"


def test_json_column_still_orderable_with_id(engine_with_schema):
    engine, schema = engine_with_schema
    table = f"{schema}.json_order"
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path TO {schema}"))
        conn.execute(text(f"CREATE TABLE {table} (id serial PRIMARY KEY, payload jsonb)"))
        conn.execute(
            text(f"INSERT INTO {table} (payload) VALUES (:payload)"),
            {"payload": '{"foo":1}'},
        )
        result = _list_records(conn, table)
    assert result["count"] == 1
