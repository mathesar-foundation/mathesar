from db.sql import utils


def test_get_interval_fields(manytypes):
    utils.get_interval_fields.install(manytypes)
    res = manytypes.execute(
        """
        SELECT pg_temp.get_interval_fields(atttypmod)
        FROM pg_attribute
        WHERE attrelid='manytypes'::regclass AND atttypid='interval'::regtype
        ORDER BY attnum;
        """
    ).fetchall()
    assert [r[0] for r in res] ==  [
        None, "year", "month", "day", "hour", "minute", "second",
        "year to month", "day to hour", "day to minute", "day to second",
        "hour to minute", "hour to second", "minute to second", "second",
        "second", "second", "day to second", "day to second", "day to second",
        "hour to second", "hour to second", "hour to second",
        "minute to second", "minute to second", "minute to second"
    ]
