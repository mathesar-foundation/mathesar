from sqlalchemy import case, select
from sqlalchemy_filters import apply_sort
from db.types import categories
from db.types.operations.convert import get_db_type_enum_from_class

WEIGHT_4 = 4
WEIGHT_3 = 3
WEIGHT_2 = 2
WEIGHT_1 = 1
WEIGHT_0 = 0
SCORE_COL = '__mathesar_relevance_score'


def get_rank_and_filter_rows_query(relation, parameters_dict, limit=10):
    """
    Given a relation, we use a score-assignment algorithm to rank rows of
    the relation by the strength of their match with the various
    parameters given in parameters_dict.
    """
    rank_cte = _get_scored_selectable(relation, parameters_dict)
    filtered_ordered_cte = apply_sort(
        select(rank_cte).where(rank_cte.columns[SCORE_COL] > 0),
        {'field': SCORE_COL, 'direction': 'desc'}
    ).cte()
    return select(
        *[filtered_ordered_cte.columns[c] for c in [col.name for col in relation.columns]]
    ).limit(limit)


def _get_scored_selectable(relation, parameters_dict):
    return select(
        relation,
        sum(
            [
                _get_col_score_expr(relation.columns[col_name], val)
                for col_name, val in parameters_dict.items()
            ]
        ).label(SCORE_COL)
    ).cte()


def _get_col_score_expr(col, param_val):
    col_type = get_db_type_enum_from_class(col.type.__class__)

    if col_type in categories.STRING_LIKE_TYPES:
        score_expr = case(
            (col.ilike(param_val), WEIGHT_4),
            (col.ilike(param_val + '%'), WEIGHT_3),
            (col.ilike('%' + param_val + '%'), WEIGHT_2),
            else_=WEIGHT_0
        )
    else:
        score_expr = case((col == param_val, WEIGHT_4), else_=WEIGHT_0)

    return score_expr
