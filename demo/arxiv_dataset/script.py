import arxiv
import json
from sqlalchemy import text

from mathesar.database.base import create_mathesar_engine

from demo.arxiv_dataset.base import get_arxiv_db_and_schema_log_path


def update_our_arxiv_dbs():
    papers = _download_arxiv_papers()
    db_schema_pairs = _get_logged_db_schema_pairs()
    for db_name, schema_name in db_schema_pairs:
        engine = create_mathesar_engine(db_name)
        with engine.begin() as conn:
            _set_search_path(conn, schema_name)
            for paper in papers:
                persist_paper(conn, paper)
        engine.dispose()


def _download_arxiv_papers():
    arxiv_search = arxiv.Search(
        query="all:electron",
        max_results=50,
        sort_by=arxiv.SortCriterion.LastUpdatedDate
    )
    return arxiv_search.results()


def _set_search_path(conn, schema_name):
    set_search_path = text(f'SET search_path="{schema_name}";')
    conn.execute(set_search_path)


def persist_paper(conn, paper):
    authors = [author.name for author in paper.authors]
    categories = paper.categories
    links = [link.href for link in paper.links]
    for x in [*authors, *categories, *links]:
        assert type(x) is str
    _persist_authors(conn, authors)
    _persist_categories(conn, categories)
    _persist_links(conn, links)
    insert_query = _get_persist_paper_insert_query(paper)
    [paper_id], = conn.execute(insert_query)
    _persist_paper_authors(conn, paper_id, authors)
    _persist_paper_categories(conn, paper_id, categories)
    _persist_paper_links(conn, paper_id, links)


def _get_persist_paper_insert_query(paper):
    id = paper.entry_id
    updated = str(paper.updated)
    published = str(paper.published)
    title = paper.title
    summary = paper.summary
    comment = paper.comment
    journal_reference = paper.journal_ref
    doi = paper.doi
    primary_category = paper.primary_category
    return text(
        f"""
                INSERT INTO "Papers" (id, "Updated", "Published", "Title", "Summary", "Comment", "Journal reference", "DOI", "Primary category")
                VALUES ({
                    _value_list(
                        _prep_value(id),
                        _prep_value(updated),
                        _prep_value(published),
                        _prep_value(title),
                        _prep_value(summary),
                        _prep_value(comment),
                        _prep_value(journal_reference),
                        _prep_value(doi),
                        _prep_value(primary_category),
                    )
                })
                ON CONFLICT DO NOTHING
                RETURNING id
            """
    )


def _value_list(*strs):
    return ', '.join(strs)


def _persist_authors(conn, author_names):
    for author_name in author_names:
        insert_query = text(
            f"""
                INSERT INTO "Authors" ("Name")
                VALUES ({_prep_value(author_name)})
                ON CONFLICT DO NOTHING
            """
        )
        conn.execute(insert_query)


def _persist_categories(conn, categories):
    for category in categories:
        insert_query = text(
            f"""
                INSERT INTO "Categories" ("Name")
                VALUES ({_prep_value(category)})
                ON CONFLICT DO NOTHING
            """
        )
        conn.execute(insert_query)


def _persist_links(conn, links):
    for link in links:
        insert_query = text(
            f"""
                INSERT INTO "Links" ("HREF")
                VALUES ({_prep_value(link)})
                ON CONFLICT DO NOTHING
            """
        )
        conn.execute(insert_query)


def _persist_paper_authors(conn, paper_id, author_ids):
    for author_id in author_ids:
        insert_query = text(
            f"""
                INSERT INTO "Paper-Author" (paper_id, author_id)
                VALUES ({
                    _value_list(
                        _prep_value(paper_id),
                        _prep_value(author_id),
                    )
                })
                ON CONFLICT DO NOTHING
            """
        )
        conn.execute(insert_query)


def _persist_paper_categories(conn, paper_id, category_ids):
    for category_id in category_ids:
        insert_query = text(
            f"""
                INSERT INTO "Paper-Category" (paper_id, category_id)
                VALUES ({
                    _value_list(
                        _prep_value(paper_id),
                        _prep_value(category_id),
                    )
                })
                ON CONFLICT DO NOTHING
            """
        )
        conn.execute(insert_query)


def _persist_paper_links(conn, paper_id, link_ids):
    for link_id in link_ids:
        insert_query = text(
            f"""
                INSERT INTO "Paper-Link" (paper_id, link_id)
                VALUES ({
                    _value_list(
                        _prep_value(paper_id),
                        _prep_value(link_id),
                    )
                })
                ON CONFLICT DO NOTHING
            """
        )
        conn.execute(insert_query)


def _prep_value(s):
    return f"$escape_token${s}$escape_token$" if s is not None else "NULL"


def _get_logged_db_schema_pairs():
    """
    Note, deduplicates the resulting pairs.
    """
    db_schema_log_path = get_arxiv_db_and_schema_log_path()
    with open(db_schema_log_path, 'r') as lines:
        return set(
            tuple(
                json.loads(line)
            )
            for line
            in lines
        )


if __name__ == '__main__':
    update_our_arxiv_dbs()
