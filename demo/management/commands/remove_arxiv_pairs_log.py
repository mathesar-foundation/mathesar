import os

from django.core.management import BaseCommand

from demo.arxiv_skeleton import get_arxiv_db_and_schema_log_path


class Command(BaseCommand):
    help = 'Cleans up the file defining arXiv data set DBs'

    def handle(self, *args, **options):
        remove_arxiv_db_and_schema_log()


def remove_arxiv_db_and_schema_log():
    """Remove the file defining arXiv data set DBs"""
    os.remove(get_arxiv_db_and_schema_log_path())
