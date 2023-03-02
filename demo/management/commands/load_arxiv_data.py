import re
import arxiv
import json
import logging
from sqlalchemy import text

from django.core.management import BaseCommand

from demo.install.arxiv_skeleton import get_arxiv_db_and_schema_log_path
from mathesar.database.base import create_mathesar_engine


class Command(BaseCommand):
    help = 'Refreshes the arXiv data set in all relevant DBs'

    def handle(self, *args, **options):
        update_our_arxiv_dbs()


def update_our_arxiv_dbs():
    """
    Will log an error if db-schema log is missing or cannot be deserialized.
    """
    papers = download_arxiv_papers()
    try:
        db_schema_pairs = _get_logged_db_schema_pairs()
    except Exception as e:
        logging.error(e, exc_info=True)
        return
    for db_name, schema_name in db_schema_pairs:
        engine = create_mathesar_engine(db_name)
        update_arxiv_schema(engine, schema_name, papers)
        engine.dispose()


def update_arxiv_schema(engine, schema_name, papers):
    with engine.begin() as conn:
        _set_search_path(conn, schema_name)
        for paper in papers:
            persist_paper(conn, paper)


def download_arxiv_papers():
    query_expression = _construct_arxiv_search_query_expression()
    arxiv_search = arxiv.Search(
        query=query_expression,
        max_results=50,
        sort_by=arxiv.SortCriterion.LastUpdatedDate
    )
    return list(arxiv_search.results())


def _construct_arxiv_search_query_expression():
    """
    Meant to return papers that have the Computer Science Database category in their category set,
    and don't have non-computer-science categories in their category set. That's because we only
    have human-friendly names and descriptions for Computer Science categories.
    """
    query = "cat:cs.DB"
    for non_cs_arxiv_cat in _non_cs_arxiv_categories:
        query += f' ANDNOT cat:{non_cs_arxiv_cat}'
    return query


def _set_search_path(conn, schema_name):
    set_search_path = text(f'SET search_path="{schema_name}";')
    conn.execute(set_search_path)


def persist_paper(conn, paper):
    authors = [
        author.name
        for author
        in paper.authors
    ]
    categories = [
        category
        for category
        in paper.categories
        if _is_category_in_arxiv_taxonomy(category)
    ]
    author_ids = _persist_values_to_single_value_table(
        conn,
        table_name="Authors",
        column_name="Name",
        values=authors
    )
    category_ids = _persist_values_to_single_value_table(
        conn,
        table_name="Categories",
        column_name="id",
        values=categories
    )
    links = paper.links
    link_ids = _persist_links(conn, links)
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
    """
    See _persist_values_to_single_value_table docstring, for reason to use DO UPDATE below.
    """
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
                ON CONFLICT ("arXiv URL")
                DO UPDATE SET "DOI" = excluded."DOI"
                RETURNING id
            """
    )
    [paper_id], = conn.execute(insert_query)
    return paper_id


def _persist_primary_category(conn, paper):
    primary_category = paper.primary_category
    if _is_category_in_arxiv_taxonomy(primary_category):
        resulting_ids = _persist_values_to_single_value_table(
            conn,
            table_name="Categories",
            column_name="id",
            values=[primary_category],
        )
        primary_category_id = resulting_ids.pop()
        return primary_category_id


def _value_list(*strs):
    return ', '.join(strs)


def _persist_links(
    conn, links
):
    """
    Derives the link's purpose (see _get_link_purpose), and adds that to the table as well.
    """
    table_name = "Links"
    href_column_name = "URL"
    purpose_column_name = "Purpose"
    ids = set()
    for link in links:
        purpose = _get_link_purpose(link)
        insert_query = text(
            f"""
                INSERT INTO "{table_name}" ("{href_column_name}", "{purpose_column_name}")
                VALUES ({_prep_value(link.href)}, {_prep_value(purpose)})
                ON CONFLICT ("{href_column_name}")
                DO UPDATE SET "{href_column_name}" = excluded."{href_column_name}"
                RETURNING id
            """
        )
        [row_id], = conn.execute(insert_query)
        ids.add(row_id)
    return ids


def _get_link_purpose(link):
    purpose = "Other"
    href = link.href
    if href.startswith('http://arxiv.org/abs/'):
        purpose = "Abstract"
    elif href.startswith('http://arxiv.org/pdf/'):
        purpose = "PDF version"
    return purpose


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


def _is_category_in_arxiv_taxonomy(category_name):
    """
    Helps exclude categories not in arXiv category taxonomy [0].

    Currently, we only have human-readable names and descriptions for CS categories, and we want
    all categories we record to have those. Normally, excluding papers that have non-CS categories
    would be enough (which we're doing by manipulating the arXiv API query string, but a paper
    might also have categories that aren't in the arXiv taxonomy. This predicate is meant to detect
    those non-arXiv categories.

    [0] https://arxiv.org/category_taxonomy
    """
    is_cs_category = bool(
        re.fullmatch(r"cs\.\w\w", category_name, flags=re.IGNORECASE)
    )
    is_non_cs_category = (category_name in _non_cs_arxiv_categories)
    return is_cs_category or is_non_cs_category


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


_non_cs_arxiv_categories = {
    'econ.EM',
    'econ.GN',
    'econ.TH',
    'eess.AS',
    'eess.IV',
    'eess.SP',
    'eess.SY',
    'math.AC',
    'math.AG',
    'math.AP',
    'math.AT',
    'math.CA',
    'math.CO',
    'math.CT',
    'math.CV',
    'math.DG',
    'math.DS',
    'math.FA',
    'math.GM',
    'math.GN',
    'math.GR',
    'math.GT',
    'math.HO',
    'math.IT',
    'math.KT',
    'math.LO',
    'math.MG',
    'math.MP',
    'math.NA',
    'math.NT',
    'math.OA',
    'math.OC',
    'math.PR',
    'math.QA',
    'math.RA',
    'math.RT',
    'math.SG',
    'math.SP',
    'math.ST',
    'astro-ph.CO',
    'astro-ph.EP',
    'astro-ph.GA',
    'astro-ph.HE',
    'astro-ph.IM',
    'astro-ph.SR',
    'cond-mat.dis-nn',
    'cond-mat.mes-hall',
    'cond-mat.mtrl-sci',
    'cond-mat.other',
    'cond-mat.quant-gas',
    'cond-mat.soft',
    'cond-mat.stat-mech',
    'cond-mat.str-el',
    'cond-mat.supr-con',
    'gr-qc',
    'hep-ex',
    'hep-lat',
    'hep-ph',
    'hep-th',
    'math-ph',
    'nlin.AO',
    'nlin.CD',
    'nlin.CG',
    'nlin.PS',
    'nlin.SI',
    'nucl-ex',
    'nucl-th',
    'physics.acc-ph',
    'physics.ao-ph',
    'physics.app-ph',
    'physics.atm-clus',
    'physics.atom-ph',
    'physics.bio-ph',
    'physics.chem-ph',
    'physics.class-ph',
    'physics.comp-ph',
    'physics.data-an',
    'physics.ed-ph',
    'physics.flu-dyn',
    'physics.gen-ph',
    'physics.geo-ph',
    'physics.hist-ph',
    'physics.ins-det',
    'physics.med-ph',
    'physics.optics',
    'physics.plasm-ph',
    'physics.pop-ph',
    'physics.soc-ph',
    'physics.space-ph',
    'quant-ph',
    'q-bio.BM',
    'q-bio.CB',
    'q-bio.GN',
    'q-bio.MN',
    'q-bio.NC',
    'q-bio.OT',
    'q-bio.PE',
    'q-bio.QM',
    'q-bio.SC',
    'q-bio.TO',
    'q-fin.CP',
    'q-fin.EC',
    'q-fin.GN',
    'q-fin.MF',
    'q-fin.PM',
    'q-fin.PR',
    'q-fin.RM',
    'q-fin.ST',
    'q-fin.TR',
    'stat.AP',
    'stat.CO',
    'stat.ME',
    'stat.ML',
    'stat.OT',
    'stat.TH',
}
