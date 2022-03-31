from sqlalchemy import func, literal, select, cast, INTEGER


def get_extrema_diff_select(selectable, column, output_label):
    """
    This function creates a select statement composed of the given
    selectable, with an additional column containing the difference
    between the max and min of the given column on each row. The
    given column needs to be in the given table.
    """
    return select(
        selectable,
        (func.max(column).over() - func.min(column).over()).label(output_label)
    )


def get_offset_order_of_magnitude_select(selectable, column, output_label):
    """
    This function returns a select statement composed of the given
    selectable, with an additional column containing an integer p such
    that p is maximal, subject to the constraint that 10**(p + 1) is
    less than or equal to the value of the given column for that row.

    """
    return select(
        selectable,
        cast(
            (func.floor(func.log(column)) - 1), INTEGER
        ).label(output_label)
    )


def divide_by_power_of_ten_select(selectable, divisor_col, power_col, output_label):
    """
    This function returns a select statement composed of the given
    selectable, with an additional column containing an integer that is the next
    after dividing the given divisor_col by 10**(the given power_col) for
    each row.
    """
    return select(
        selectable,
        cast(
            func.floor(
                divisor_col / func.pow(literal(10.0), power_col)
            ),
            INTEGER
        ).label(output_label)
    )
