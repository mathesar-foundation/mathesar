import pickle
from demo.install.base import ARXIV_PAPERS_PICKLE
from django.core.management import BaseCommand
from demo.management.commands.load_arxiv_data import download_arxiv_papers


class Command(BaseCommand):
    help = 'Downloads and pickles some Arxiv data, to be later preloaded together with the Arxiv dataset.'

    def handle(self, *args, **options):
        download_and_pickle_some_arxiv_data()


def download_and_pickle_some_arxiv_data():
    papers = download_arxiv_papers()
    with open(ARXIV_PAPERS_PICKLE, 'wb') as f:
        pickle.dump(papers, f)
