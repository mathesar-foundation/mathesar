from datetime import datetime as dt
from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, Table, Column, MetaData, select, cast
from sqlalchemy import Interval as SAInterval
from sqlalchemy.exc import IntegrityError
from db.engine import _add_custom_types_to_engine
from db.tests.types import fixtures
from db.types import interval, datetime


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
temporary_testing_schema = fixtures.temporary_testing_schema
engine_email_type = fixtures.engine_email_type


def test_interval_type_column_creation(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        conn.execute(text(f"SET search_path={app_schema}"))
        metadata = MetaData(bind=conn)
        test_table = Table(
            "test_table",
            metadata,
            Column("time_intervals", interval.Interval),
        )
        test_table.create()


def test_interval_type_column_reflection(engine_email_type):
    engine, app_schema = engine_email_type
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            "test_table",
            metadata,
            Column("time_intervals", SAInterval),
        )
        test_table.create()

    _add_custom_types_to_engine(engine)
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table("test_table", metadata, autoload_with=conn)
    expect_cls = interval.Interval
    actual_cls = reflect_table.columns["time_intervals"].type.__class__
    assert actual_cls == expect_cls


intervals_out_to_ins = {
    # The keys are expected output, the list of strings are various inputs
    # that should map to the output denoted by the associated key.  These
    # should be comprehensive enough to document expected parseable
    # intervals.
    'P0Y0M1DT0H0M0S': ['1 day', '1 days', '1.0 days', 'P1D', '1D'],
    'P1Y2M3DT4H5M6S': [
        '1 year 2 months 3 days 4 hours 5 minutes 6 seconds',
        '1-2 3 4:05:06', '1 year 2 months 3 days 4:05:06'
    ],
    # negative interval
    'P0Y0M-1DT-3H0M0S': [
        '1 day 3 hours ago', '-1 day, -3 hours', 'P-1DT-3H', '-1D, -3H',
        '-1 -3:00:00'
    ],
    # mixed positive negative interval
    'P0Y0M1DT-3H0M0S': [
        '1 day -3 hours', '-1 day 3 hours ago', 'P1DT-3H', '1D -3H',
        '1 day, -3H', '1 -3:00:00'
    ],
    # Pluralization doesn't matter
    'P0Y0M2DT0H0M0S': ['2 day', '2 days'],
    # Some roll overs.  Note that we do not accrue days, since some
    # are different lengths whenever DST begins or ends.
    'P0Y0M0DT45H1M10S': [
        '45 hours, 1 minute, 10 seconds', '45 hours 70 seconds',
        '44 hours 59 minutes 130 seconds', '162070 sec',
        '162070S', '45:01:10'
    ],
    # months roll into years, but days don't roll into months (since
    # different months have different numbers of days).
    'P1Y1M40DT0H0M0S': ['1 year 1 month 40 days', '13 months 40 days'],
    'P0Y0M0DT0H0M1.234567S': [
        '1.234567 seconds', '1234.567 milliseconds', '1234.567ms',
        '1234567 microseconds'
    ],
    # some more exotic time intervals
    'P73Y2M10DT0H0M0S': ['5 decades 22 years 14 months 1 week 3 days'],
    'P100Y0M0DT0H0M0S': ['1 century', '1C', '1 centuries', '10 decades'],
    'P2000Y0M0DT0H0M0S': ['2 millennia', '2 millennium', '20 centuries'],
}

intervals_self_map = [(key, key) for key in intervals_out_to_ins]
intervals_exploded = intervals_self_map + [
    (val, key) for key in intervals_out_to_ins for val in intervals_out_to_ins[key]
]


@pytest.mark.parametrize('interval_in,interval_out', intervals_exploded)
def test_interval_transformations(engine_with_types, interval_in, interval_out):
    # First we make sure the interval input strings cast properly
    with engine_with_types.begin() as conn:
        res = conn.execute(select(cast(interval_in, interval.Interval))).scalar()
    assert res == interval_out


def test_interval_insert_select(engine_email_type):
    # Now we bulk test inserting and selecting
    engine, app_schema = engine_email_type
    column_name = 'time_interval'
    insert_dicts = [{column_name: tup[0]} for tup in intervals_exploded]
    output_values = [tup[1] for tup in intervals_exploded]
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            'test_table',
            metadata,
            Column(column_name, interval.Interval),
        )
        test_table.create()
        conn.execute(test_table.insert().values(insert_dicts))
        res = conn.execute(select(test_table)).fetchall()
    assert len(res) == len(output_values)
    assert all([res[i][0] == output_values[i] for i in range(len(res))])


def test_interval_datetime_addition(engine_with_types):
    three_days_interval = cast('3 days 4 hours 30 minutes', interval.Interval)
    the_date = cast(dt(2020, 1, 1), datetime.TIMESTAMP_WITHOUT_TIME_ZONE)
    with engine_with_types.begin() as conn:
        res = conn.execute(
            select(the_date + three_days_interval)
        ).scalar()
    assert res == dt(2020, 1, 4, 4, 30)


def test_interval_interval_addition(engine_with_types):
    three_days_interval = cast('3 days 4 hours 30 minutes', interval.Interval)
    five_days_interval = cast('5 days', interval.Interval)
    with engine_with_types.begin() as conn:
        res = conn.execute(
            select(three_days_interval + five_days_interval)
        ).scalar()
    assert res == 'P0Y0M8DT4H30M0S'
