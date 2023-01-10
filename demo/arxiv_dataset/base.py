import os
import json
from pathlib import Path

from sqlalchemy import text


def setup_and_register_schema_for_receiving_arxiv_data(
    engine, schema_name='Arxiv'
):
    db_name, schema_name = _setup_arxiv_schema(engine, schema_name)
    _make_sure_parent_directories_present(get_arxiv_db_and_schema_log_path())
    _append_db_and_schema_to_log(db_name, schema_name)


def _make_sure_parent_directories_present(path_to_file):
    path_to_file = Path(path_to_file)
    parent_directory_of_file = path_to_file.parent
    parent_directory_of_file.mkdir(parents=True, exist_ok=True)


def _append_db_and_schema_to_log(db_name, schema_name):
    path = get_arxiv_db_and_schema_log_path()
    db_and_schema = [db_name, schema_name]
    with open(path, 'a') as f:
        json.dump(db_and_schema, f)
        f.write('\n')


def get_arxiv_db_and_schema_log_path():
    return os.path.abspath(
        '/var/lib/mathesar/demo/arxiv_db_schema_log'
    )


def _setup_arxiv_schema(engine, schema_name):
    drop_schema_query = text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE;')
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
