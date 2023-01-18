"""
We load the arXiv data set by first setting up a skeleton defining the data
model whenever a user starts a new demo, and then loading data into the data
model via a cron job that runs a management command.
"""

import os
import json
from pathlib import Path

from django.conf import settings
from sqlalchemy import text

SCHEMA_DESCRIPTION = (
    "Regularly updated by a script that gets the 50 most recent Computer"
    " Science research papers from arXiv and inserts it into this schema."
)


def setup_and_register_schema_for_receiving_arxiv_data(
    engine, schema_name='Latest Papers from arXiv'
):
    db_name, schema_name = _setup_arxiv_schema(engine, schema_name)
    _make_sure_parent_directories_present(get_arxiv_db_and_schema_log_path())
    append_db_and_arxiv_schema_to_log(db_name, schema_name)


def _make_sure_parent_directories_present(path_to_file):
    path_to_file = Path(path_to_file)
    parent_directory_of_file = path_to_file.parent
    parent_directory_of_file.mkdir(parents=True, exist_ok=True)


def append_db_and_arxiv_schema_to_log(db_name, schema_name):
    path = get_arxiv_db_and_schema_log_path()
    if db_name == getattr(settings, 'MATHESAR_DEMO_TEMPLATE', None):
        return
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
    set_schema_comment_query = text(
        f'COMMENT ON SCHEMA "{schema_name}"'
        f'IS $escape_token${SCHEMA_DESCRIPTION}$escape_token$;'
    )
    with engine.begin() as conn, open(sql_setup_script) as f:
        conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f.read()))
        conn.execute(set_schema_comment_query)
    db_name = engine.url.database
    return db_name, schema_name


def _get_sql_setup_script_path():
    current_dir = os.path.abspath(os.path.dirname(__file__))
    resources = os.path.join(current_dir, 'resources')
    return os.path.join(resources, 'arxiv_dataset_setup.sql')
