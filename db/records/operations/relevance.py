from sqlalchemy import case, select, literal
from sqlalchemy_filters import apply_sort
from db.types import categories
from db.types.base import get_db_type_enum_from_class

WEIGHT_4 = 4
WEIGHT_3 = 3
WEIGHT_2 = 2
WEIGHT_1 = 1
WEIGHT_0 = 0


def rank_and_filter_rows(relation, parameters_dict, engine):
    """
    Given a relation, we use a score-assignment algorithm to rank rows of
    the relation by the strength of their match with the various
    parameters given in parameters_dict.
    """
    rank_cte = select(relation, _get_full_score_expr(relation, parameters_dict, engine).label('score')).cte()
    filtered_ordered_cte = apply_sort(
        select(rank_cte).where(rank_cte.columns['score'] > 0),
        {'field': 'score', 'direction': 'desc'}
    ).cte()
    return select(
        *[filtered_ordered_cte.columns[c] for c in [col.name for col in relation.columns]]
    )



def _get_full_score_expr(relation, parameters_dict, engine):
    col_scores = [
        _get_col_score_expr(relation.columns[col_name], val, engine)
        for col_name, val in parameters_dict.items()
    ]
    return sum(col_scores)

def _get_col_score_expr(col, param_val, engine):
    col_type = get_db_type_enum_from_class(col.type.__class__, engine)

    if col_type in categories.STRING_LIKE_TYPES:
        score_expr = case(
            (col.ilike(param_val), WEIGHT_4),
            (col.ilike(param_val + '%'), WEIGHT_3),
            (col.ilike('%' + param_val + '%'), WEIGHT_2),
            else_=WEIGHT_0
        )
    else:
        score_expr = literal(0)

    return score_expr
