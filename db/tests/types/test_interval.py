from psycopg2.errors import CheckViolation
import pytest
from sqlalchemy import text, Table, Column, MetaData, select, cast
from sqlalchemy import Interval as SAInterval
from sqlalchemy.exc import IntegrityError
from db.engine import _add_custom_types_to_engine
from db.tests.types import fixtures
from db.types import interval


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
        '1.234567 seconds', '1234.567 milliseconds', '1234.567ms'
    ]

}

intervals_self_map = [(key, key) for key in intervals_out_to_ins]
intervals_exploded = intervals_self_map + [
    (val, key) for key in intervals_out_to_ins for val in intervals_out_to_ins[key]
    # ('3 decades 2 days ago', 'P-30Y0M-2DT0H0M0S'),
    # ('3 decades 5 years 2 days ago', 'P-35Y0M-2DT0H0M0S'),
    # (
    #     '3 decades 5 years 2 days 100 hours 90 minutes 120 seconds',
    #     'P35Y0M2DT101H32M0S',
    # ),
]


@pytest.mark.parametrize('interval_in,interval_out', intervals_exploded)
def test_interval_transformations(engine_with_types, interval_in, interval_out):
    with engine_with_types.begin() as conn:
        res = conn.execute(select(cast(interval_in, interval.Interval))).scalar()
    assert res == interval_out
#
#
# def test_create_email_type_domain_passes_correct_emails(engine_email_type):
#     engine, _ = engine_email_type
#     email_addresses_correct = ["alice@example.com", "alice@example"]
#     for address in email_addresses_correct:
#         with engine.begin() as conn:
#             res = conn.execute(
#                 text(f"SELECT '{address}'::{email.DB_TYPE};")
#             )
#             assert res.fetchone()[0] == address
#
#
# def test_create_email_type_domain_accepts_uppercase(engine_email_type):
#     engine, _ = engine_email_type
#     email_addresses_correct = ["alice@example.com", "alice@example"]
#     for address in email_addresses_correct:
#         with engine.begin() as conn:
#             res = conn.execute(
#                 text(f"SELECT '{address}'::{email.DB_TYPE.upper()};")
#             )
#             assert res.fetchone()[0] == address
#
#
# def test_create_email_type_domain_checks_broken_emails(engine_email_type):
#     engine, _ = engine_email_type
#     address_incorrect = "aliceexample.com"
#     with pytest.raises(IntegrityError) as e:
#         with engine.begin() as conn:
#             conn.execute(
#                 text(
#                     f"SELECT '{address_incorrect}'::{email.DB_TYPE};"
#                 )
#             )
#         assert type(e.orig) == CheckViolation
