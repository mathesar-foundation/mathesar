import os
import json

from sqlalchemy import text


def setup_and_register_schema_for_receiving_arxiv_data(engine):
    db_name, schema_name = _setup_arxiv_schema(engine)
    _append_db_and_schema_to_log(db_name, schema_name)


def _append_db_and_schema_to_log(db_name, schema_name):
    path = get_arxiv_db_and_schema_log_path()
    db_and_schema = [db_name, schema_name]
    with open(path, 'a') as f:
        json.dump(db_and_schema, f)


def get_arxiv_db_and_schema_log_path():
    return os.path.abspath(
        '/var/lib/mathesar/demo/arxiv_db_schema_log'
    )


def _setup_arxiv_schema(engine):
    schema_name = 'Arxiv'
    drop_schema_query = text(f'DROP SCHEMA IF EXISTS "{schema_name}";')
    create_schema_query = text(f'CREATE SCHEMA "{schema_name}";')
    set_search_path = text(f'SET search_path="{schema_name}";')
    sql_setup_script = _get_sql_setup_script_path()
    with engine.begin() as conn, open(sql_setup_script) as f:
        conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f.read()))
    db_name = engine.url.database
    return db_name, schema_name


def _get_sql_setup_script_path():
    current_dir = os.path.abspath(os.path.dirname(__file__))
    return os.path.join(current_dir, 'setup.sql')
