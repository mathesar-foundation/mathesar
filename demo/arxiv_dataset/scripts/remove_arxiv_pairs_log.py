import os
from demo.arxiv_dataset.base import get_arxiv_db_and_schema_log_path


def remove_arxiv_db_and_schema_log():
    os.remove(get_arxiv_db_and_schema_log_path())


if __name__ == '__main__':
    remove_arxiv_db_and_schema_log()
