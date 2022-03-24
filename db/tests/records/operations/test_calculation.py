from decimal import Decimal
import pytest
from sqlalchemy import select

from db.records.operations import calculation


CHECK_CTE_FLAG = False


magnitude_columns_test_list = [
    ('big_num', Decimal('997.195962329400'), 1, -3),
    ('big_int', 9993, 2, 21),
    ('sm_num', Decimal('0.0002982117006408827'), Decimal('-5'), 6),
    ('sm_dbl', 0.0009893330872576484, -5.0, 12),
    ('pm_seq', 199, 1, -10),
    ('tens_seq', 1990, 2, 0),
]


@pytest.mark.parametrize(
    'colname,diff',
    [(t[0], t[1]) for t in magnitude_columns_test_list]
)
def test_get_extrema_diff_select(magnitude_table_obj, colname, diff):
    global CHECK_CTE_FLAG
    magnitude, engine = magnitude_table_obj
    sel = calculation.get_extrema_diff_select(
        magnitude, magnitude.columns[colname], 'extrema_diff'
    )
    if CHECK_CTE_FLAG:
        sel = select(sel.cte())
    CHECK_CTE_FLAG = not CHECK_CTE_FLAG
    with engine.begin() as conn:
        res = conn.execute(sel).fetchone()
    assert list(res.keys()) == [
        'id', 'big_num', 'big_int', 'sm_num', 'sm_dbl',
        'pm_seq', 'tens_seq', 'extrema_diff'
    ]
    assert res['extrema_diff'] == diff


@pytest.mark.parametrize(
    'colname,power',
    [(t[0], t[2]) for t in magnitude_columns_test_list]
)
def test_get_offset_order_of_magnitude_select(magnitude_table_obj, colname, power):
    global CHECK_CTE_FLAG
    magnitude, engine = magnitude_table_obj
    extrema_cte = calculation.get_extrema_diff_select(
        magnitude, magnitude.columns[colname], 'extrema_diff'
    ).cte()
    sel = calculation.get_offset_order_of_magnitude_select(
        extrema_cte, extrema_cte.columns['extrema_diff'], 'power'
    )
    if CHECK_CTE_FLAG:
        sel = select(sel.cte())
    CHECK_CTE_FLAG = not CHECK_CTE_FLAG
    with engine.begin() as conn:
        res = conn.execute(sel).fetchone()
    assert list(res.keys()) == [
        'id', 'big_num', 'big_int', 'sm_num', 'sm_dbl',
        'pm_seq', 'tens_seq', 'extrema_diff', 'power'
    ]
    assert res['power'] == power


@pytest.mark.parametrize(
    'colname,raw_id',
    [(t[0], t[3]) for t in magnitude_columns_test_list]
)
def test_divide_by_power_of_ten_select(magnitude_table_obj, colname, raw_id):
    global CHECK_CTE_FLAG
    magnitude, engine = magnitude_table_obj
    extrema_cte = calculation.get_extrema_diff_select(
        magnitude, magnitude.columns[colname], 'extrema_diff'
    ).cte()
    power_cte = calculation.get_offset_order_of_magnitude_select(
        extrema_cte, extrema_cte.columns['extrema_diff'], 'power'
    ).cte()
    sel = calculation.divide_by_power_of_ten_select(
        power_cte, power_cte.columns[colname], power_cte.columns['power'], 'raw_id'
    )
    if CHECK_CTE_FLAG:
        sel = select(sel.cte())
    CHECK_CTE_FLAG = not CHECK_CTE_FLAG
    with engine.begin() as conn:
        res = conn.execute(sel).fetchone()
    assert list(res.keys()) == [
        'id', 'big_num', 'big_int', 'sm_num', 'sm_dbl',
        'pm_seq', 'tens_seq', 'extrema_diff', 'power', 'raw_id',
    ]
    assert res['raw_id'] == raw_id
