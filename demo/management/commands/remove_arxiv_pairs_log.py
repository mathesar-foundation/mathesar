import os
from demo.arxiv_skeleton import get_arxiv_db_and_schema_log_path


def remove_arxiv_db_and_schema_log():
    os.remove(get_arxiv_db_and_schema_log_path())
