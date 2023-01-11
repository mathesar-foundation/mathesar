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
        query="cat:cs.DB",
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
    author_ids = _persist_values_to_single_value_table(
        conn,
        table_name="Authors",
        column_name="Name",
        values=authors
    )
    category_ids = _persist_values_to_single_value_table(
        conn,
        table_name="Categories",
        column_name="Name",
        values=categories
    )
    link_ids = _persist_values_to_single_value_table(
        conn,
        table_name="Links",
        column_name="URL",
        values=links
    )
    paper_id = _persist_paper(conn, paper)
    _persist_paper_mappings(
        conn,
        paper_id=paper_id,
        table_name="Paper-Author Map",
        column_name="author_id",
        values=author_ids
    )
    _persist_paper_mappings(
        conn,
        paper_id=paper_id,
        table_name="Paper-Category Map",
        column_name="category_id",
        values=category_ids
    )
    _persist_paper_mappings(
        conn,
        paper_id=paper_id,
        table_name="Paper-Link Map",
        column_name="link_id",
        values=link_ids
    )


def _persist_paper(conn, paper):
    arxiv_url = paper.entry_id
    updated = str(paper.updated)
    published = str(paper.published)
    title = paper.title
    summary = paper.summary
    comment = paper.comment
    journal_reference = paper.journal_ref
    doi = paper.doi
    primary_category_id = _persist_primary_category(conn, paper)
    insert_query = text(
        f"""
                INSERT INTO "Papers" (
                    "arXiv URL",
                    "Updated",
                    "Published",
                    "Title",
                    "Summary",
                    "Comment",
                    "Journal reference",
                    "DOI",
                    "Primary category"
                )
                VALUES ({
                    _value_list(
                        _prep_value(arxiv_url),
                        _prep_value(updated),
                        _prep_value(published),
                        _prep_value(title),
                        _prep_value(summary),
                        _prep_value(comment),
                        _prep_value(journal_reference),
                        _prep_value(doi),
                        _prep_value(primary_category_id),
                    )
                })
                ON CONFLICT DO NOTHING
                RETURNING id
            """
    )
    [paper_id], = conn.execute(insert_query)
    return paper_id


def _persist_primary_category(conn, paper):
    primary_category = paper.primary_category
    resulting_ids = _persist_values_to_single_value_table(
        conn,
        table_name="Categories",
        column_name="Name",
        values=[primary_category],
    )
    primary_category_id = resulting_ids.pop()
    return primary_category_id


def _value_list(*strs):
    return ', '.join(strs)


def _persist_values_to_single_value_table(
    conn, table_name, column_name, values
):
    """
    Note, we use a seemingly meaningless DO UPDATE, because, in constrast to DO
    NOTHING, that makes the query's RETURNING work regardless of whether there was a
    conflict. Otherwise, we would not receive an id if the record already exists.
    """
    ids = set()
    for value in values:
        insert_query = text(
            f"""
                INSERT INTO "{table_name}" ("{column_name}")
                VALUES ({_prep_value(value)})
                ON CONFLICT ("{column_name}")
                DO UPDATE SET "{column_name}" = excluded."{column_name}"
                RETURNING id
            """
        )
        [row_id], = conn.execute(insert_query)
        ids.add(row_id)
    return ids


def _persist_paper_mappings(conn, table_name, paper_id, column_name, values):
    for value in values:
        insert_query = text(
            f"""
                INSERT INTO "{table_name}" (paper_id, {column_name})
                VALUES ({
                    _value_list(
                        _prep_value(paper_id),
                        _prep_value(value),
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
