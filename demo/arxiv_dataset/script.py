import arxiv
import json
from sqlalchemy import text

from demo.arxiv_dataset.base import get_arxiv_db_and_schema_log_path


def update_our_arxiv_dbs():
    papers = _download_arxiv_papers()
    db_schema_pairs = _get_logged_db_schema_pairs()
    for db_name, schema_name in db_schema_pairs:
        engine = _get_engine(db_name)
        with engine.begin() as conn:
            _set_search_path(conn, schema_name)
            for paper in papers:
                persist_paper(conn, schema_name, paper)


def _download_arxiv_papers():
    arxiv_search = arxiv.Search(
        max_results=50,
        sort_by=arxiv.SortCriterion.LastUpdatedDate
    )
    return arxiv_search.results()


def _set_search_path(conn, schema_name):
    set_search_path = text(f'SET search_path="{schema_name}";')
    conn.execute(set_search_path)


def _get_engine(db_name):
    # TODO
    pass


def persist_paper(conn, schema_name, paper):
    # TODO maybe run this only once?
    authors = None
    categories = None
    links = None
    map_of_author_to_id = _persist_authors(conn, authors)
    map_of_category_to_id = _persist_categories(conn, categories)
    map_of_link_to_id = _persist_links(conn, links)
    # TODO finish insert_query
    insert_query = text(
        f"""
            INSERT INTO Authors (Name)
            VALUES ()
            RETURNING id
        """
    )
    [paper_id] = conn.execute(insert_query)
    # TODO insert into Paper-Author, Paper-Category, Paper-Link bridge tables


def _persist_authors(conn, author_names):
    map_of_author_to_id = {}
    for author_name in author_names:
        insert_query = text(
            f"""
                INSERT INTO Authors (Name)
                VALUES ({author_name})
                RETURNING id
            """
        )
        result = conn.execute(insert_query)
        [author_id] = result.fetchone()
        map_of_author_to_id[author_name] = author_id
    return map_of_author_to_id


def _persist_categories(conn, category_names):
    # TODO
    pass


def _persist_links(conn, link_urls):
    # TODO
    pass


def _get_logged_db_schema_pairs():
    db_schema_log_path = get_arxiv_db_and_schema_log_path()
    with open(db_schema_log_path, 'r') as lines:
        return [
            json.loads(line)
            for line
            in lines
        ]


if __name__ == '__main__':
    update_our_arxiv_dbs()
