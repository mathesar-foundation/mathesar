import pytest
from sqlalchemy import text, Table, Column, MetaData, select, cast
from sqlalchemy.dialects.postgresql import DATE as SA_DATE
from sqlalchemy.dialects.postgresql import INTERVAL as SA_INTERVAL
from sqlalchemy.dialects.postgresql import TIME as SA_TIME
from sqlalchemy.dialects.postgresql import TIMESTAMP as SA_TIMESTAMP

from db.types.custom import datetime
from db.types import exceptions


datetime_types = [
    (
        datetime.DATE, SA_DATE(),
        {
            '2021-01-03 AD': [
                '2021-01-03', '3 Jan, 2021', 'Jan 3, 2021', '3 Jan, 2021 AD'
            ],
            '0023-01-03 BC': ['0023-01-03 BC', '3 Jan, 23 BC', 'Jan 3, 23 BC']
        },
    ),
    (
        datetime.Interval, SA_INTERVAL(),
        {
            # The keys are expected output, the list of strings are
            # various inputs that should map to the output denoted by the
            # associated key.  These should be comprehensive enough to
            # document expected parseable intervals.
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
            # checking disaggregation
            'P0Y11M3DT13H50M30.4S': [
                '1 year -1 month 3 days 14 hours -10 minutes 30.4 seconds'
            ],
            'P0Y-11M-3DT-13H-50M-30.4S': [
                '1 year -1 month 3 days 14 hours -10 minutes 30.4 seconds ago'
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
    ),
    (
        datetime.TIME_WITH_TIME_ZONE, SA_TIME(timezone=True),
        {
            '12:30:45.0+05:30': ['12:30:45+05:30'],
            '12:30:45.0Z': ['12:30:45', '12:30:45 UTC'],
            '12:30:45.123456-08:00': ['12:30:45.123456-08', '12:30:45.123456000-08'],
        }
    ),
    (
        datetime.TIME_WITHOUT_TIME_ZONE, SA_TIME(timezone=False),
        {
            '12:30:00.0': ['12:30'],
        }
    ),
    (
        datetime.TIMESTAMP_WITH_TIME_ZONE, SA_TIMESTAMP(timezone=True),
        {
            '2000-07-30T19:15:03.65Z AD': [
                '30 July, 2000 19:15:03.65', '07-30-2000 19:15:03.65+00'
            ],
            '10000-01-01T00:00:00.0Z AD': ['10000-01-01 00:00:00'],
            '0025-03-03T16:30:15.0Z BC': ['3 March, 25 BC, 17:30:15+01'],
        }
    ),
    (
        datetime.TIMESTAMP_WITHOUT_TIME_ZONE, SA_TIMESTAMP(timezone=False),
        {
            '17654-03-02T01:00:00.0 AD': ['17654-03-02 01:00:00']
        }
    ),
]


@pytest.mark.parametrize('test_type', [type_[0] for type_ in datetime_types])
def test_datetime_type_column_creation(engine_with_schema, test_type):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        conn.execute(text(f'SET search_path={app_schema}'))
        metadata = MetaData(bind=conn)
        test_table = Table(
            'test_table',
            metadata,
            Column('time_type', test_type),
        )
        test_table.create()


@pytest.mark.parametrize(
    'test_type,sa_type',
    [(type_[0], type_[1]) for type_ in datetime_types]
)
def test_datetime_type_column_reflection(engine_with_schema, test_type, sa_type):
    engine, app_schema = engine_with_schema
    col_name = 'time_type'
    table_name = 'test_table'
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            table_name,
            metadata,
            Column(col_name, sa_type),
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table(table_name, metadata, autoload_with=conn)
    expect_cls = test_type
    actual_cls = reflect_table.columns[col_name].type.__class__
    assert actual_cls == expect_cls


datetime_defaults = [
    (tup[0], key)
    for tup in datetime_types
    for key in tup[2]
]


@pytest.mark.parametrize('type_,val', datetime_defaults)
def test_datetime_type_column_default(engine_with_schema, type_, val):
    engine, app_schema = engine_with_schema
    default_str = val
    column_name = 'time_type'
    table_name = 'test_table'
    with engine.begin() as conn:
        conn.execute(text(f'SET search_path={app_schema}'))
        metadata = MetaData(bind=conn)
        test_table = Table(
            table_name,
            metadata,
            Column(
                column_name, type_, server_default=default_str,
            ),
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table(table_name, metadata, autoload_with=conn)
    test_col = reflect_table.columns[column_name]
    default_sql_txt = str(test_col.server_default.arg)
    default_selectable = select(cast(text(default_sql_txt), test_col.type))
    with engine.begin() as conn:
        actual_default = conn.execute(default_selectable).scalar()
    assert actual_default == default_str


def test_interval_type_column_args(engine_with_schema):
    engine, app_schema = engine_with_schema
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            'test_table',
            metadata,
            Column(
                'time_intervals',
                datetime.Interval(precision=5, fields='SECOND')
            )
        )
        test_table.create()

    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        reflect_table = Table('test_table', metadata, autoload_with=conn)
    expect_cls = datetime.Interval
    actual_cls = reflect_table.columns['time_intervals'].type.__class__
    assert actual_cls == expect_cls
    actual_interval = reflect_table.columns['time_intervals'].type
    assert actual_interval.precision == 5
    assert actual_interval.fields.upper() == 'SECOND'


invalid_args_list = [(None, 'SECONDS'), (1.34, None), (5, 'HOURS')]


@pytest.mark.parametrize('precision,fields', invalid_args_list)
def test_interval_type_column_invalid_args(precision, fields):
    with pytest.raises(exceptions.InvalidTypeParameters):
        datetime.Interval(precision=precision, fields=fields)


types_self_map = [
    (tup[0], key, key)
    for tup in datetime_types
    for key in tup[2]
]

types_exploded = types_self_map + [
    (tup[0], val, key)
    for tup in datetime_types
    for key in tup[2]
    for val in tup[2][key]
]


@pytest.mark.parametrize('type_,val_in,val_out', types_exploded)
def test_type_transformations(engine, type_, val_in, val_out):
    # First we make sure the date/time input strings cast properly
    with engine.begin() as conn:
        res = conn.execute(select(cast(val_in, type_))).scalar()
    assert res == val_out


@pytest.mark.parametrize(
    'type_,out_in_map', [(tup[0], tup[2]) for tup in datetime_types]
)
def test_interval_insert_select(engine_with_schema, type_, out_in_map):
    # Now we bulk test inserting and selecting
    fixed_type_self_map = [(key, key) for key in out_in_map]
    fixed_type_exploded = fixed_type_self_map + [
        (val, key) for key in out_in_map for val in out_in_map[key]
    ]
    engine, app_schema = engine_with_schema
    column_name = 'time_type'
    insert_dicts = [{column_name: tup[0]} for tup in fixed_type_exploded]
    output_values = [tup[1] for tup in fixed_type_exploded]
    with engine.begin() as conn:
        metadata = MetaData(bind=conn, schema=app_schema)
        test_table = Table(
            'test_table',
            metadata,
            Column(column_name, type_),
        )
        test_table.create()
        conn.execute(test_table.insert().values(insert_dicts))
        res = conn.execute(select(test_table)).fetchall()
    assert len(res) == len(output_values)
    assert all([res[i][0] == output_values[i] for i in range(len(res))])


def test_interval_datetime_addition(engine):
    three_days_interval = cast('3 days 4 hours 30 minutes', datetime.Interval)
    the_date = cast('2020-01-01', datetime.TIMESTAMP_WITHOUT_TIME_ZONE)
    with engine.begin() as conn:
        res = conn.execute(
            select(
                cast(
                    the_date + three_days_interval,
                    datetime.TIMESTAMP_WITHOUT_TIME_ZONE
                )
            )
        ).scalar()
    assert res == '2020-01-04T04:30:00.0 AD'


def test_interval_interval_addition(engine):
    three_days_interval = cast('3 days 4 hours 30 minutes', datetime.Interval)
    five_days_interval = cast('5 days', datetime.Interval)
    with engine.begin() as conn:
        res = conn.execute(
            select(cast(three_days_interval + five_days_interval, datetime.Interval))
        ).scalar()
    assert res == 'P0Y0M8DT4H30M0S'
