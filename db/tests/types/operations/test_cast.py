from decimal import Decimal

import pytest
from psycopg2.errors import InvalidParameterValue
from sqlalchemy import Table, Column, MetaData, select, cast, text
from sqlalchemy import VARCHAR, NUMERIC
from sqlalchemy.exc import DataError
import json

from db.types.custom.base import CUSTOM_DB_TYPE_TO_SA_CLASS
from db.columns.operations.select import get_column_attnum_from_name, get_column_default
from db.columns.operations.alter import alter_column_type
from db.tables.operations.select import get_oid_from_table
from db.types.custom import multicurrency
from db.types.operations import cast as cast_operations
from db.types.base import (
    DatabaseType, PostgresType, MathesarCustomType, get_available_known_db_types,
    get_db_type_enum_from_class,
)


TARGET_DICT = "target_dict"
VALID = "valid"
INVALID = "invalid"


MASTER_DB_TYPE_MAP_SPEC = {
    # This dict specifies the full map of what types can be cast to what
    # target types in Mathesar.  Format of each top-level key, val pair is:
    # <db_set_type_name>: {
    #     TARGET_DICT: {
    #         <target_type_1>: {
    #             VALID: [(in_val, out_val), (in_val, out_val)],
    #             INVALID: [in_val, in_val]
    #         },
    #         <target_type_2>: {
    #             INVALID: [(in_val, out_val), (in_val, out_val)]
    #             INVALID: [in_val, in_val]
    #         },
    #     }
    # }
    #
    # The TARGET_DICT is a dict with keys giving a valid target type for
    # alteration of a column of the given type, and values giving a dict
    # of valid and invalid casting values.  VALID value list is a list of
    # tuples representing the input and expected output, whereas INVALID
    # value list only needs input (since it should break, giving no output)
    PostgresType.BIGINT: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(500, 500), (500000000000, 500000000000)]},
            PostgresType.BOOLEAN: {VALID: [(1, True), (0, False)], INVALID: [3]},
            PostgresType.CHARACTER: {VALID: [(3, "3")]},
            PostgresType.DOUBLE_PRECISION: {VALID: [(3, 3.0)]},
            PostgresType.INTEGER: {VALID: [(500, 500)]},
            MathesarCustomType.MATHESAR_MONEY: {
                VALID: [(1234, Decimal('1234.0'))],
            },
            PostgresType.MONEY: {
                VALID: [(1234, "$1,234.00")],
            },
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        1234123412341234,
                        {
                            multicurrency.VALUE: 1234123412341234,
                            multicurrency.CURRENCY: "USD"
                        }
                    )
                ],
            },
            PostgresType.NUMERIC: {VALID: [(1, Decimal('1.0'))]},
            PostgresType.REAL: {VALID: [(5, 5.0)]},
            PostgresType.SMALLINT: {VALID: [(500, 500)]},
            PostgresType.TEXT: {VALID: [(3, "3")]},
            PostgresType.CHARACTER_VARYING: {VALID: [(3, "3")]},
        }
    },
    PostgresType.BOOLEAN: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(True, 1), (False, 0)]},
            PostgresType.BOOLEAN: {VALID: [(True, True), (False, False)]},
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.DOUBLE_PRECISION: {VALID: [(True, 1.0), (False, 0.0)]},
            PostgresType.INTEGER: {VALID: [(True, 1), (False, 0)]},
            PostgresType.NUMERIC: {VALID: [(True, Decimal('1.0')), (False, Decimal('0'))]},
            PostgresType.REAL: {VALID: [(True, 1.0), (False, 0.0)]},
            PostgresType.SMALLINT: {VALID: [(True, 1), (False, 0)]},
            PostgresType.TEXT: {VALID: [(True, 'true'), (False, 'false')]},
            PostgresType.CHARACTER_VARYING: {VALID: [(True, 'true'), (False, 'false')]},
        }
    },
    PostgresType.JSON: {
        TARGET_DICT: {
            PostgresType.JSONB: {
                VALID: [
                    ({"key1": "val1"}, {"key1": "val1"}),
                    ({"key2": "val2"}, {"key2": "val2"})
                ],
                INVALID: [],
            },
            PostgresType.JSON: {
                VALID: [
                    ({"key1": "val1"}, {"key1": "val1"}),
                    ({"key2": "val2"}, {"key2": "val2"})
                ],
                INVALID: [],
            },
            PostgresType.TEXT: {
                VALID: [
                    ({"key1": "val1"}, '{"key1": "val1"}'),
                    ({"key2": "val2"}, '{"key2": "val2"}')
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER: {
                VALID: [
                    ({'key1': 'val1'}, "{'key1': 'val1'}")
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER_VARYING: {
                VALID: [
                    ({"key1": "val1"}, '{"key1": "val1"}'),
                    ({"key2": "val2"}, '{"key2": "val2"}')
                ],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_OBJECT: {
                VALID: [
                    ({'key1': 'val1'}, {'key1': 'val1'})
                ],
                INVALID: [[1,2,3]],
            },
            MathesarCustomType.MATHESAR_JSON_ARRAY: {
                VALID: [
                    ([1,2,3], [1,2,3])
                ],
                INVALID: [{'key1': 'val1'}],
            },
        },
    },
    PostgresType.JSONB: {
        TARGET_DICT: {
            PostgresType.JSONB: {
                VALID: [
                    ({"key1": "val1"}, {"key1": "val1"}),
                    ({"key2": "val2"}, {"key2": "val2"})
                ],
                INVALID: [],
            },
            PostgresType.JSON: {
                VALID: [
                    ({"key1": "val1"}, {"key1": "val1"}),
                    ({"key2": "val2"}, {"key2": "val2"})
                ],
                INVALID: [],
            },
            PostgresType.TEXT: {
                VALID: [
                    ({"key1": "val1"}, '{"key1": "val1"}'),
                    ({"key2": "val2"}, '{"key2": "val2"}')
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER: {
                VALID: [
                    ({'key1': 'val1'}, "{'key1': 'val1'}")
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER_VARYING: {
                VALID: [
                    ({"key1": "val1"}, '{"key1": "val1"}'),
                    ({"key2": "val2"}, '{"key2": "val2"}')
                ],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_OBJECT: {
                VALID: [
                    ({'key1': 'val1'}, {'key1': 'val1'})
                ],
                INVALID: [[1,2,3]],
            },
            MathesarCustomType.MATHESAR_JSON_ARRAY: {
                VALID: [
                    ([1,2,3], [1,2,3])
                ],
                INVALID: [{'key1': 'val1'}],
            },
        },
    },
    MathesarCustomType.MATHESAR_JSON_OBJECT: {
        TARGET_DICT: {
            PostgresType.JSONB: {
                VALID: [
                    ({"key1": "val1"}, {"key1": "val1"})
                ],
                INVALID: [],
            },
            PostgresType.JSON: {
                VALID: [
                    ({"key1": "val1"}, {"key1": "val1"}),
                ],
                INVALID: [],
            },
            PostgresType.TEXT: {
                VALID: [
                    ({"key1": "val1"}, '{"key1": "val1"}')
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER: {
                VALID: [
                    ({'key1': 'val1'}, "{'key1': 'val1'}")
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER_VARYING: {
                VALID: [
                    ({"key1": "val1"}, '{"key1": "val1"}'),
                ],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_OBJECT: {
                VALID: [],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_ARRAY: {
                VALID: [],
                INVALID: [],
            },
        },
    },
    MathesarCustomType.MATHESAR_JSON_ARRAY: {
        TARGET_DICT: {
            PostgresType.JSONB: {
                VALID: [
                    ([1,2,3], [1,2,3])
                ],
                INVALID: [],
            },
            PostgresType.JSON: {
                VALID: [
                    ([1,2,3], [1,2,3])
                ],
                INVALID: [],
            },
            PostgresType.TEXT: {
                VALID: [
                    ([1,2,3], '[1,2,3]')
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER: {
                VALID: [
                    ([1,2,3], "[1,2,3]")
                ],
                INVALID: [],
            },
            PostgresType.CHARACTER_VARYING: {
                VALID: [
                    ([1,2,3], '[1,2,3]')
                ],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_OBJECT: {
                VALID: [],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_ARRAY: {
                VALID: [],
                INVALID: [],
            },
        },
    },
    PostgresType.CHARACTER: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [("4", 4)], INVALID: ["c"]},
            PostgresType.BOOLEAN: {VALID: [("t", True), ("f", False)], INVALID: ["c"]},
            PostgresType.CHARACTER: {VALID: [("a", "a")]},
            PostgresType.DOUBLE_PRECISION: {VALID: [("1", 1)], INVALID: ["b"]},
            MathesarCustomType.EMAIL: {VALID: [], INVALID: ["a"]},
            PostgresType.INTEGER: {VALID: [("4", 4)], INVALID: ["j"]},
            PostgresType.INTERVAL: {VALID: []},
            MathesarCustomType.MATHESAR_MONEY: {VALID: []},
            PostgresType.MONEY: {VALID: []},
            PostgresType.JSON: {
                VALID: [
                    ("{'key1': 'val1'}", {'key1': 'val1'})
                ],
                INVALID: [],
            },
            PostgresType.JSONB: {
                VALID: [
                    ("{'key1': 'val1'}", {'key1': 'val1'})
                ],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_OBJECT: {
                VALID: [
                    ("{'key1': 'val1'}", {'key1': 'val1'})
                ],
                INVALID: ["{key",],
            },
            MathesarCustomType.MATHESAR_JSON_ARRAY: {
                VALID: [
                    ('[1,2,3]', [1,2,3])
                ],
                INVALID: ["{key",],
            },
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        "1",
                        {multicurrency.VALUE: 1, multicurrency.CURRENCY: "USD"}
                    )
                ],
                INVALID: ["n"],
            },
            PostgresType.NUMERIC: {VALID: [("1", Decimal("1"))], INVALID: ["a"]},
            PostgresType.REAL: {VALID: [("1", 1.0)], INVALID: ["b"]},
            PostgresType.SMALLINT: {VALID: [("4", 4)], INVALID: ["j"]},
            PostgresType.DATE: {VALID: [], INVALID: ["n"]},
            PostgresType.TIMESTAMP_WITH_TIME_ZONE: {VALID: [], INVALID: ["n"]},
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: {VALID: [], INVALID: ["n"]},
            PostgresType.TEXT: {VALID: [("a", "a")]},
            MathesarCustomType.URI: {VALID: [], INVALID: ["a"]},
            PostgresType.CHARACTER_VARYING: {VALID: [("a", "a")]},
        }
    },
    PostgresType.DATE: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.DATE: {VALID: [("1999-01-18 AD", "1999-01-18 AD")]},
            PostgresType.TEXT: {VALID: [("1999-01-18 AD", "1999-01-18")]},
            PostgresType.CHARACTER_VARYING: {VALID: [("1999-01-18 AD", "1999-01-18")]},
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: {
                VALID: [("1999-01-18 AD", "1999-01-18T00:00:00.0 AD")]
            },
        },
    },
    PostgresType.DOUBLE_PRECISION: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(500, 500)]},
            PostgresType.BOOLEAN: {VALID: [(1.0, True), (0.0, False)]},
            PostgresType.CHARACTER: {VALID: [(3, "3")]},
            PostgresType.DOUBLE_PRECISION: {VALID: [(1, 1.0), (1.5, 1.5)]},
            PostgresType.INTEGER: {VALID: [(500, 500)]},
            MathesarCustomType.MATHESAR_MONEY: {VALID: [(12.12, Decimal('12.12'))]},
            PostgresType.MONEY: {VALID: [(12.12, "$12.12")]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        12.12,
                        {
                            multicurrency.VALUE: 12.12,
                            multicurrency.CURRENCY: "USD"
                        }
                    )
                ]
            },
            PostgresType.NUMERIC: {VALID: [(1, 1.0)]},
            PostgresType.REAL: {VALID: [(1, 1.0), (1.5, 1.5)]},
            PostgresType.SMALLINT: {VALID: [(500, 500)]},
            PostgresType.TEXT: {VALID: [(3, "3")]},
            PostgresType.CHARACTER_VARYING: {VALID: [(3, "3")]},
        }
    },
    MathesarCustomType.EMAIL: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            MathesarCustomType.EMAIL: {VALID: [("alice@example.com", "alice@example.com")]},
            PostgresType.TEXT: {VALID: [("bob@example.com", "bob@example.com")]},
            PostgresType.CHARACTER_VARYING: {VALID: [("bob@example.com", "bob@example.com")]},
        }
    },
    PostgresType.INTEGER: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(500, 500)]},
            PostgresType.BOOLEAN: {VALID: [(1, True), (0, False)], INVALID: [3]},
            PostgresType.CHARACTER: {VALID: [(3, "3")]},
            PostgresType.DOUBLE_PRECISION: {VALID: [(3, 3.0)]},
            PostgresType.INTEGER: {VALID: [(500, 500)]},
            MathesarCustomType.MATHESAR_MONEY: {VALID: [(500, Decimal('500.0'))]},
            PostgresType.MONEY: {VALID: [(12, "$12.00")]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (12, {multicurrency.VALUE: 12, multicurrency.CURRENCY: "USD"})
                ]
            },
            PostgresType.NUMERIC: {VALID: [(1, Decimal('1.0'))]},
            PostgresType.REAL: {VALID: [(5, 5.0)]},
            PostgresType.SMALLINT: {VALID: [(500, 500)]},
            PostgresType.TEXT: {VALID: [(3, "3")]},
            PostgresType.CHARACTER_VARYING: {VALID: [(3, "3")]},
        }
    },
    PostgresType.INTERVAL: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {
                VALID: []
            },
            PostgresType.INTERVAL: {
                VALID: [
                    ("P0Y0M3DT3H5M30S", "P0Y0M3DT3H5M30S")
                ]
            },
            PostgresType.TEXT: {
                VALID: []
            },
            PostgresType.CHARACTER_VARYING: {
                VALID: [
                    ("P0Y0M3DT3H5M30S", "3 days 03:05:30")
                ]
            },
        }
    },
    MathesarCustomType.MATHESAR_MONEY: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(12341234, 12341234)]},
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.DOUBLE_PRECISION: {VALID: [(12.12, 12.12)]},
            PostgresType.INTEGER: {VALID: [(123412, 123412)]},
            MathesarCustomType.MATHESAR_MONEY: {VALID: [(12.12, Decimal('12.12'))]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        12.12,
                        {
                            multicurrency.VALUE: 12.12,
                            multicurrency.CURRENCY: 'USD'
                        }
                    )
                ]
            },
            PostgresType.MONEY: {VALID: [(12.12, "$12.12")]},
            PostgresType.NUMERIC: {VALID: [(12.12, Decimal('12.12'))]},
            PostgresType.REAL: {VALID: [(12.12, 12.12)]},
            PostgresType.SMALLINT: {VALID: [(1234, 1234)]},
            PostgresType.TEXT: {VALID: [(12.12, "12.12")]},
            PostgresType.CHARACTER_VARYING: {VALID: [(12.12, "12.12")]},
        }
    },
    # TODO resolve all PostgresType.MONEY to number type casts are failing.
    PostgresType.MONEY: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [
                # TODO Following case is failing for some reason.
                # ("$12341234.00", 12341234)
            ]},
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.DOUBLE_PRECISION: {VALID: [
                # TODO Following case is failing for some reason.
                # ("$12.12", 12.12)
            ]},
            PostgresType.INTEGER: {VALID: [
                # TODO Following case is failing for some reason.
                # ("$123412.00", 123412)
            ]},
            MathesarCustomType.MATHESAR_MONEY: {VALID: [("$20.00", Decimal(20.0))]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        "$12.12",
                        {
                            multicurrency.VALUE: 12.12,
                            multicurrency.CURRENCY: 'USD'
                        }
                    )
                ]
            },
            PostgresType.MONEY: {VALID: [("$12.12", "$12.12")]},
            PostgresType.REAL: {VALID: [
                # TODO Following case is failing for some reason.
                # ("$12.12", 12.12)
            ]},
            PostgresType.SMALLINT: {VALID: [
                # TODO Following case is failing for some reason.
                # ("$1234.00", 1234)
            ]},
            PostgresType.TEXT: {VALID: [("$12.12", "$12.12")]},
            PostgresType.CHARACTER_VARYING: {VALID: [("$12.12", "$12.12")]},
            PostgresType.NUMERIC: {VALID: [
                # TODO Following case is failing for some reason.
                # ("$12.34", 12.34)
            ]},
        }
    },
    MathesarCustomType.MULTICURRENCY_MONEY: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        {
                            multicurrency.VALUE: 1234.12,
                            multicurrency.CURRENCY: 'XYZ'
                        },
                        {
                            multicurrency.VALUE: 1234.12,
                            multicurrency.CURRENCY: 'XYZ'
                        }
                    )
                ]
            },
            PostgresType.TEXT: {
                VALID: [
                    (
                        {
                            multicurrency.VALUE: 1234.12,
                            multicurrency.CURRENCY: 'XYZ'
                        },
                        '(1234.12,XYZ)'
                    )
                ]
            },
            PostgresType.CHARACTER_VARYING: {
                VALID: [
                    (
                        {
                            multicurrency.VALUE: 1234.12,
                            multicurrency.CURRENCY: 'XYZ'
                        },
                        '(1234.12,XYZ)'
                    )
                ]
            },
        }
    },
    PostgresType.NUMERIC: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(500, 500)]},
            PostgresType.BOOLEAN: {
                VALID: [(1, True), (0, False), (1.0, True), (0.0, False)],
                INVALID: [42, -1]
            },
            PostgresType.CHARACTER: {VALID: [(3, "3")], INVALID: [1234, 1.2]},
            PostgresType.DOUBLE_PRECISION: {VALID: [(1, 1.0), (1.5, 1.5)]},
            PostgresType.INTEGER: {
                VALID: [(500, 500)],
                INVALID: [1.234, 1234123412341234]
            },
            MathesarCustomType.MATHESAR_MONEY: {VALID: [(12.12, Decimal('12.12'))]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (1, {multicurrency.VALUE: 1, multicurrency.CURRENCY: "USD"})
                ]
            },
            PostgresType.MONEY: {VALID: [(12.12, "$12.12")]},
            PostgresType.NUMERIC: {VALID: [(1, 1.0)]},
            PostgresType.REAL: {VALID: [(1, 1.0), (1.5, 1.5)]},
            PostgresType.SMALLINT: {
                VALID: [(500, 500)],
                INVALID: [1.234, 12341234]
            },
            PostgresType.TEXT: {VALID: [(3, "3")]},
            PostgresType.CHARACTER_VARYING: {VALID: [(3, "3")]},
        }
    },
    PostgresType.REAL: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(500, 500)]},
            PostgresType.BOOLEAN: {
                VALID: [(1.0, True), (0.0, False)],
                INVALID: [42, -1]
            },
            PostgresType.CHARACTER: {VALID: [(3, "3")], INVALID: [234, 5.78]},
            PostgresType.DOUBLE_PRECISION: {VALID: [(1, 1.0), (1.5, 1.5)]},
            PostgresType.INTEGER: {
                VALID: [(500, 500)],
                INVALID: [3.345]
            },
            MathesarCustomType.MATHESAR_MONEY: {VALID: [(12.12, Decimal('12.12'))]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        1.2,
                        {multicurrency.VALUE: 1.2, multicurrency.CURRENCY: "USD"}
                    )
                ]
            },
            PostgresType.MONEY: {VALID: [(12.12, "$12.12")]},
            PostgresType.NUMERIC: {VALID: [(1, 1.0)]},
            PostgresType.REAL: {VALID: [(1, 1.0), (1.5, 1.5)]},
            PostgresType.SMALLINT: {
                VALID: [(500, 500)],
                INVALID: [3.345]
            },
            PostgresType.TEXT: {VALID: [(3, "3")]},
            PostgresType.CHARACTER_VARYING: {VALID: [(3, "3")]},
        }
    },
    PostgresType.SMALLINT: {
        TARGET_DICT: {
            PostgresType.BIGINT: {VALID: [(500, 500)]},
            PostgresType.BOOLEAN: {VALID: [(1, True), (0, False)], INVALID: [3]},
            PostgresType.CHARACTER: {VALID: [(3, "3")]},
            PostgresType.DOUBLE_PRECISION: {VALID: [(3, 3.0)]},
            PostgresType.INTEGER: {VALID: [(500, 500)]},
            MathesarCustomType.MATHESAR_MONEY: {VALID: [(12, 12)]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (1, {multicurrency.VALUE: 1, multicurrency.CURRENCY: "USD"})
                ]
            },
            PostgresType.MONEY: {VALID: [(12, "$12.00")]},
            PostgresType.NUMERIC: {VALID: [(1, Decimal('1.0'))]},
            PostgresType.REAL: {VALID: [(5, 5.0)]},
            PostgresType.SMALLINT: {VALID: [(500, 500)]},
            PostgresType.TEXT: {VALID: [(3, "3")]},
            PostgresType.CHARACTER_VARYING: {VALID: [(3, "3")]},
        }
    },
    PostgresType.TIME_WITHOUT_TIME_ZONE: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.TIME_WITHOUT_TIME_ZONE: {VALID: [("12:30:45", "12:30:45.0")]},
            PostgresType.TIME_WITH_TIME_ZONE: {VALID: [("12:30:45", "12:30:45.0Z")]},
            PostgresType.TEXT: {VALID: [("12:30:45", "12:30:45")]},
            PostgresType.CHARACTER_VARYING: {VALID: [("12:30:45", "12:30:45")]},
        },
    },
    PostgresType.TIME_WITH_TIME_ZONE: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.TIME_WITH_TIME_ZONE: {
                VALID: [("12:30:45+01:00", "12:30:45.0+01:00")]
            },
            PostgresType.TIME_WITHOUT_TIME_ZONE: {VALID: [("12:30:45+01:00", "12:30:45.0")]},
            PostgresType.TEXT: {VALID: [("12:30:45+01:00", "12:30:45+01")]},
            PostgresType.CHARACTER_VARYING: {VALID: [("12:30:45+01:00", "12:30:45+01")]},
        },
    },
    PostgresType.TIMESTAMP_WITH_TIME_ZONE: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.DATE: {
                VALID: [("1999-01-18T00:00:00.0Z AD", "1999-01-18 AD")],
                INVALID: [
                    "1999-01-18T12:30:45.0Z AD",
                    "1999-01-18T00:00:00.0+01:00 AD",
                ]
            },
            PostgresType.TIMESTAMP_WITH_TIME_ZONE: {
                VALID: [
                    (
                        "1999-01-18T12:30:45.0+01:00 AD",
                        "1999-01-18T11:30:45.0Z AD",
                    ),
                ]
            },
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: {
                VALID: [
                    (
                        "1999-01-18T12:30:45.0+01:00 AD",
                        "1999-01-18T11:30:45.0 AD",
                    )
                ],
            },
            PostgresType.TEXT: {
                VALID: [
                    ("1999-01-18T12:30:45.0+01:00 AD", "1999-01-18 11:30:45+00")
                ]
            },
            PostgresType.CHARACTER_VARYING: {
                VALID: [
                    ("1999-01-18T12:30:45.0+01:00 AD", "1999-01-18 11:30:45+00")
                ]
            },
        },
    },
    PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.DATE: {
                VALID: [("1999-01-18T00:00:00.0 AD", "1999-01-18 AD")],
                INVALID: ["1999-01-18T00:10:00.0 AD"]
            },
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: {
                VALID: [("1999-01-18T12:30:45", "1999-01-18T12:30:45.0 AD")]
            },
            PostgresType.TIMESTAMP_WITH_TIME_ZONE: {
                VALID: [("1999-01-18T12:30:45", "1999-01-18T12:30:45.0Z AD")]
            },
            PostgresType.TEXT: {VALID: [("1999-01-18T12:30:45.0 AD", "1999-01-18 12:30:45")]},
            PostgresType.CHARACTER_VARYING: {
                VALID: [("1999-01-18T12:30:45.0 AD", "1999-01-18 12:30:45")]
            },
        },
    },
    PostgresType.TEXT: {
        TARGET_DICT: {
            PostgresType.BIGINT: {
                VALID: [("432", 432), ("1234123412341234", 1234123412341234)],
                INVALID: ["1.2234"]
            },
            PostgresType.BOOLEAN: {
                VALID: [
                    ("true", True), ("false", False), ("t", True), ("f", False),
                    ("yes", True), ("y", True), ("no", False), ("n", False),
                    ("on", True), ("off", False),
                ],
                INVALID: ["cat"],
            },
            PostgresType.CHARACTER: {VALID: [("a", "a")]},
            PostgresType.JSON: {
                VALID: [
                    ('{"key1": "val1"}', json.loads('{"key1": "val1"}')),
                    ('{"key2": "val2"}', json.loads('{"key2": "val2"}'))
                ],
                INVALID: [],
            },
            PostgresType.JSONB: {
                VALID: [
                    ('{"key1": "val1"}', json.loads('{"key1": "val1"}')),
                    ('{"key2": "val2"}', json.loads('{"key2": "val2"}'))
                ],
                INVALID:  [],
            },
            MathesarCustomType.MATHESAR_JSON_OBJECT: {
                VALID: [
                    ('{"key1": "val1"}', {"key1": "val1"})
                ],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_ARRAY: {
                VALID: [
                    ('[1, 2, 3]', [1, 2, 3])
                ],
                INVALID: ['{"key1',],
            },
            PostgresType.DOUBLE_PRECISION: {
                VALID: [("1.234", 1.234)],
                INVALID: ["bat"],
            },
            MathesarCustomType.EMAIL: {
                VALID: [("alice@example.com", "alice@example.com")],
                INVALID: ["alice-example.com"]
            },
            PostgresType.INTEGER: {
                VALID: [("432", 432)],
                INVALID: ["1.2234"]
            },
            PostgresType.INTERVAL: {
                VALID: [
                    ("1 day", "P0Y0M1DT0H0M0S"),
                    ("1 week", "P0Y0M7DT0H0M0S"),
                    ("3:30", "P0Y0M0DT3H30M0S"),
                    ("00:03:30", "P0Y0M0DT0H3M30S"),
                ],
                INVALID: ["1 potato", "3"],
            },
            MathesarCustomType.MATHESAR_MONEY: {
                VALID: [
                    ("$1234", 1234),
                    ("$1234 HK", 1234),
                    ("$1234.00", 1234),
                    ("$1,234.00", 1234),
                    ("1234 USD", 1234),
                    ("$1,234,567.1234", Decimal('1234567.1234')),
                ],
                INVALID: ["nanumb"],
            },
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        "1234",
                        {multicurrency.VALUE: 1234, multicurrency.CURRENCY: "USD"}
                    )
                ],
                INVALID: ["nanumb"],
            },
            PostgresType.MONEY: {
                VALID: [("$1234", "$1,234.00")],
                INVALID: ["nanumb"],
            },
            PostgresType.NUMERIC: {
                VALID: [
                    ("3.14", Decimal("3.14")),
                    ("123,456.7", Decimal("123456.7")),
                    ("123.456,7", Decimal("123456.7")),
                    ("123 456,7", Decimal("123456.7")),
                    ("1,23,456.7", Decimal("123456.7")),
                    ("123'456.7", Decimal("123456.7")),
                    ("-3.14", Decimal("-3.14")),
                    ("-123,456.7", Decimal("-123456.7")),
                    ("-123.456,7", Decimal("-123456.7")),
                    ("-123 456,7", Decimal("-123456.7")),
                    ("-1,23,456.7", Decimal("-123456.7")),
                    ("-123'456.7", Decimal("-123456.7"))
                ],
                INVALID: ["not a number"],
            },
            PostgresType.REAL: {
                VALID: [("1.234", 1.234)],
                INVALID: ["real"]
            },
            PostgresType.SMALLINT: {
                VALID: [("432", 432)],
                INVALID: ["1.2234"]
            },
            PostgresType.DATE: {
                VALID: [
                    ("1999-01-18", "1999-01-18 AD"),
                    ("1/18/1999", "1999-01-18 AD"),
                    ("jan-1999-18", "1999-01-18 AD"),
                    ("19990118", "1999-01-18 AD"),
                ],
                INVALID: [
                    "18/1/1999",
                    "not a date",
                    "1234",
                ]
            },
            MathesarCustomType.URI: {
                VALID: [
                    ("https://centerofci.org", "https://centerofci.org"),
                    ("http://centerofci.org", "http://centerofci.org"),
                    ("centerofci.org", "http://centerofci.org"),
                    ("nasa.gov", "http://nasa.gov"),
                    ("museumoflondon.org.uk", "http://museumoflondon.org.uk"),
                ],
                INVALID: ["/sdf/", "localhost", "$123.45", "154.23USD"]
            },
            PostgresType.TEXT: {VALID: [("a string", "a string")]},
            PostgresType.TIME_WITHOUT_TIME_ZONE: {
                VALID: [("04:05:06", "04:05:06.0"), ("04:05", "04:05:00.0")],
                INVALID: ["not a time"]
            },
            PostgresType.TIME_WITH_TIME_ZONE: {
                VALID: [
                    ("04:05:06", "04:05:06.0Z"),
                    ("04:05+01", "04:05:00.0+01:00")
                ],
                INVALID: ["not a time"]
            },
            PostgresType.TIMESTAMP_WITH_TIME_ZONE: {
                VALID: [("1999-01-18 12:30:45+00", "1999-01-18T12:30:45.0Z AD")],
                INVALID: ["not a timestamp"]
            },
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: {
                VALID: [("1999-01-18 12:30:45", "1999-01-18T12:30:45.0 AD")],
                INVALID: ["not a timestamp"]
            },
            PostgresType.CHARACTER_VARYING: {VALID: [("a string", "a string")]},
        }
    },
    MathesarCustomType.URI: {
        TARGET_DICT: {
            PostgresType.CHARACTER: {VALID: []},
            PostgresType.TEXT: {VALID: [("https://centerofci.org", "https://centerofci.org")]},
            MathesarCustomType.URI: {VALID: [("https://centerofci.org", "https://centerofci.org")]},
            PostgresType.CHARACTER_VARYING: {VALID: [("https://centerofci.org", "https://centerofci.org")]},
        }
    },
    PostgresType.CHARACTER_VARYING: {
        TARGET_DICT: {
            PostgresType.BIGINT: {
                VALID: [("432", 432), ("1234123412341234", 1234123412341234)],
                INVALID: ["1.2234"]
            },
            PostgresType.BOOLEAN: {
                VALID: [
                    ("true", True), ("false", False), ("t", True), ("f", False),
                    ("yes", True), ("y", True), ("no", False), ("n", False),
                    ("on", True), ("off", False),
                ],
                INVALID: ["cat"],
            },
            PostgresType.CHARACTER: {VALID: [("a", "a")]},
            PostgresType.DATE: {
                VALID: [
                    ("1999-01-18", "1999-01-18 AD"),
                    ("1/18/1999", "1999-01-18 AD"),
                    ("jan-1999-18", "1999-01-18 AD"),
                    ("19990118", "1999-01-18 AD"),
                ],
                INVALID: [
                    "18/1/1999",
                    "not a date",
                    "1234",
                ]
            },
            PostgresType.JSON: {
                VALID: [
                    ('{"key1": "val1"}', json.loads('{"key1": "val1"}')),
                    ('{"key2": "val2"}', json.loads('{"key2": "val2"}'))
                ],
                INVALID: [],
            },
            PostgresType.JSONB: {
                VALID: [
                    ('{"key1": "val1"}', json.loads('{"key1": "val1"}')),
                    ('{"key2": "val2"}', json.loads('{"key2": "val2"}'))
                ],
                INVALID: [],
            },            
            MathesarCustomType.MATHESAR_JSON_OBJECT: {
                VALID: [
                    ('{"key1": "val1"}', {"key1": "val1"})
                ],
                INVALID: [],
            },
            MathesarCustomType.MATHESAR_JSON_ARRAY: {
                VALID: [
                    ('[1, 2, 3]', [1, 2, 3])
                ],
                INVALID: ['{key1'],
            },
            PostgresType.DOUBLE_PRECISION: {
                VALID: [("1.234", 1.234)],
                INVALID: ["bat"],
            },
            MathesarCustomType.EMAIL: {
                VALID: [("alice@example.com", "alice@example.com")],
                INVALID: ["alice-example.com"]
            },
            PostgresType.INTEGER: {
                VALID: [("432", 432)],
                INVALID: ["1.2234"]
            },
            PostgresType.INTERVAL: {
                VALID: [
                    ("1 day", "P0Y0M1DT0H0M0S"),
                    ("1 week", "P0Y0M7DT0H0M0S"),
                    ("3:30", "P0Y0M0DT3H30M0S"),
                    ("00:03:30", "P0Y0M0DT0H3M30S"),
                ],
                INVALID: ["1 potato", "3"],
            },
            MathesarCustomType.MATHESAR_MONEY: {
                VALID: [
                    ("$1234", 1234),
                    ("-$$ 1,234,567", Decimal('-1234567')),
                ],
                INVALID: ["nanumb"],
            },
            PostgresType.MONEY: {VALID: [("$12.12", "$12.12")]},
            MathesarCustomType.MULTICURRENCY_MONEY: {
                VALID: [
                    (
                        "1234",
                        {multicurrency.VALUE: 1234, multicurrency.CURRENCY: "USD"}
                    )
                ],
                INVALID: ["nanumb"],
            },
            PostgresType.NUMERIC: {
                VALID: [
                    ("3.14", Decimal("3.14")),
                    ("123,456.7", Decimal("123456.7")),
                    ("123.456,7", Decimal("123456.7")),
                    ("123 456,7", Decimal("123456.7")),
                    ("1,23,456.7", Decimal("123456.7")),
                    ("123'456.7", Decimal("123456.7")),
                    ("-3.14", Decimal("-3.14")),
                    ("-123,456.7", Decimal("-123456.7")),
                    ("-123.456,7", Decimal("-123456.7")),
                    ("-123 456,7", Decimal("-123456.7")),
                    ("-1,23,456.7", Decimal("-123456.7")),
                    ("-123'456.7", Decimal("-123456.7"))
                ],
                INVALID: ["not a number"],
            },
            PostgresType.REAL: {
                VALID: [("1.234", 1.234)],
                INVALID: ["real"]
            },
            PostgresType.SMALLINT: {
                VALID: [("432", 432)],
                INVALID: ["1.2234"]
            },
            PostgresType.TEXT: {VALID: [("a string", "a string")]},
            PostgresType.TIME_WITHOUT_TIME_ZONE: {
                VALID: [("04:05:06", "04:05:06.0"), ("04:05", "04:05:00.0")],
                INVALID: ["not a time"]
            },
            PostgresType.TIME_WITH_TIME_ZONE: {
                VALID: [
                    ("04:05:06", "04:05:06.0Z"),
                    ("04:05+01", "04:05:00.0+01:00")
                ],
                INVALID: [
                    "not a time",
                ]
            },
            PostgresType.TIMESTAMP_WITH_TIME_ZONE: {
                VALID: [("1999-01-18 12:30:45+00", "1999-01-18T12:30:45.0Z AD")],
                INVALID: ["not a timestamp"]
            },
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: {
                VALID: [("1999-01-18 12:30:45+00", "1999-01-18T12:30:45.0 AD")],
                INVALID: ["not a timestamp"]
            },
            MathesarCustomType.URI: {
                VALID: [("https://centerofci.org", "https://centerofci.org")],
                INVALID: ["/sdf/"]
            },
            PostgresType.CHARACTER_VARYING: {VALID: [("a string", "a string")]},
        }
    }
}


# TODO move to a more fundamental db type test suite
def test_get_alter_column_types_with_custom_engine(engine):
    available_known_db_types = get_available_known_db_types(engine)
    custom_db_types = CUSTOM_DB_TYPE_TO_SA_CLASS.keys()
    for custom_db_type in custom_db_types:
        assert custom_db_type in available_known_db_types


# TODO move to a more fundamental db type test suite
def test_db_type_juggling_consistency(engine):
    """
    A db type should remain constant after being reflected from its SA class.
    """
    available_known_db_types = get_available_known_db_types(engine)
    for db_type in available_known_db_types:
        sa_class = db_type.get_sa_class(engine)
        db_type_from_sa_class = get_db_type_enum_from_class(sa_class, engine)
        assert db_type == db_type_from_sa_class


# This list is assembled by taking all source and target type pairs without type options and then
# appending some of those pairs again with type options specified.
type_test_list = [
    (
        source_type,
        target_type,
        {},
    )
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items()
    for target_type in val[TARGET_DICT]
] + [
    (source_type, PostgresType.NUMERIC, {"precision": 5})
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items() if PostgresType.NUMERIC in val[TARGET_DICT]
] + [
    (source_type, PostgresType.NUMERIC, {"precision": 5, "scale": 3})
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items() if PostgresType.NUMERIC in val[TARGET_DICT]
] + [
    (source_type, PostgresType.TIME_WITHOUT_TIME_ZONE, {"precision": 5})
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items() if PostgresType.TIME_WITHOUT_TIME_ZONE in val[TARGET_DICT]
] + [
    (source_type, PostgresType.TIME_WITH_TIME_ZONE, {"precision": 5})
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items() if PostgresType.TIME_WITH_TIME_ZONE in val[TARGET_DICT]
] + [
    (source_type, PostgresType.TIMESTAMP_WITH_TIME_ZONE, {"precision": 5})
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items() if PostgresType.TIMESTAMP_WITH_TIME_ZONE in val[TARGET_DICT]
] + [
    (source_type, PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE, {"precision": 5})
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items() if PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE in val[TARGET_DICT]
] + [
    (source_type, PostgresType.CHARACTER, {"length": 5})
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items() if PostgresType.CHARACTER in val[TARGET_DICT]
]


@pytest.mark.parametrize(
    "source_type,target_type,options", type_test_list
)
def test_alter_column_type_alters_column_type(
    engine_with_schema, source_type, target_type, options
):
    """
    The massive number of cases make sure all type casting functions at
    least pass a smoke test for each type mapping defined in
    MASTER_DB_TYPE_MAP_SPEC above.
    """
    engine, schema = engine_with_schema
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    source_sa_type = source_type.get_sa_class(engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, source_sa_type),
        schema=schema
    )
    input_table.create()
    with engine.begin() as conn:
        alter_column_type(
            get_oid_from_table(TABLE_NAME, schema, engine),
            COLUMN_NAME,
            engine,
            conn,
            target_type,
            options
        )
    metadata = MetaData(bind=engine)
    metadata.reflect()
    actual_column = Table(
        TABLE_NAME,
        metadata,
        schema=schema,
        autoload_with=engine
    ).columns[COLUMN_NAME]
    actual_type = get_db_type_enum_from_class(actual_column.type.__class__, engine)
    assert actual_type == target_type


type_test_data_args_list = [
    (
        NUMERIC(precision=5),
        PostgresType.NUMERIC,
        {},
        1,
        1.0,
    ),
    (
        NUMERIC(precision=5, scale=2),
        PostgresType.NUMERIC,
        {},
        1,
        1.0,
    ),
    (
        PostgresType.NUMERIC,
        PostgresType.NUMERIC,
        {"precision": 5, "scale": 2},
        1.234,
        Decimal("1.23"),
    ),
    # test that rounding is as intended
    (
        PostgresType.NUMERIC,
        PostgresType.NUMERIC,
        {"precision": 5, "scale": 2},
        1.235,
        Decimal("1.24"),
    ),
    (
        PostgresType.CHARACTER_VARYING,
        PostgresType.NUMERIC,
        {"precision": 6, "scale": 2},
        "5000.134",
        Decimal("5000.13"),
    ),
    (
        PostgresType.TIME_WITHOUT_TIME_ZONE,
        PostgresType.TIME_WITHOUT_TIME_ZONE,
        {"precision": 0},
        "00:00:00.1234",
        "00:00:00.0",
    ),
    (
        PostgresType.TIME_WITH_TIME_ZONE,
        PostgresType.TIME_WITH_TIME_ZONE,
        {"precision": 0},
        "00:00:00.1234-04:30",
        "00:00:00.0-04:30",
    ),
    (
        PostgresType.TIMESTAMP_WITH_TIME_ZONE,
        PostgresType.TIMESTAMP_WITH_TIME_ZONE,
        {"precision": 0},
        "1999-01-01 00:00:00",
        "1999-01-01T00:00:00.0Z AD",
    ),
    (
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
        {"precision": 0},
        "1999-01-01 00:00:00",
        "1999-01-01T00:00:00.0 AD",
    ),
    (
        PostgresType.CHARACTER_VARYING,
        PostgresType.CHARACTER,
        {"length": 5},
        "abcde",
        "abcde",
    ),
]


@pytest.mark.parametrize(
    "source_type,target_type,options,value,expect_value", type_test_data_args_list
)
def test_alter_column_type_casts_column_data_args(
        engine_with_schema, source_type, target_type, options, value, expect_value,
):
    engine, schema = engine_with_schema
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    # Sometimes source_type is a DatabaseType enum and other times an SA type instance.
    source_sa_type = (
        source_type.get_sa_class(engine)
        if isinstance(source_type, DatabaseType)
        else source_type
    )
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, source_sa_type),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(value,))
    with engine.begin() as conn:
        conn.execute(ins)
        alter_column_type(
            get_oid_from_table(TABLE_NAME, schema, engine),
            COLUMN_NAME,
            engine,
            conn,
            target_type,
            options
        )
    metadata = MetaData(bind=engine)
    metadata.reflect()
    actual_table = Table(
        TABLE_NAME,
        metadata,
        schema=schema,
        autoload_with=engine
    )
    sel = actual_table.select()
    with engine.connect() as conn:
        res = conn.execute(sel).fetchall()
    actual_value = res[0][0]
    assert actual_value == expect_value


type_test_data_gen_list = [
    (
        source_type,
        target_type,
        in_val,
        out_val,
    )
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items()
    for target_type in val[TARGET_DICT]
    for in_val, out_val in val[TARGET_DICT][target_type].get(VALID, [])
]


@pytest.mark.parametrize(
    "source_type,target_type,in_val,out_val", type_test_data_gen_list
)
def test_alter_column_casts_data_gen(
        engine_with_schema, source_type, target_type, in_val, out_val
):
    engine, schema = engine_with_schema
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    source_sa_type = source_type.get_sa_class(engine)
    default_unsupported = [
        MathesarCustomType.MULTICURRENCY_MONEY,
        PostgresType.JSON,
        PostgresType.JSONB,
        MathesarCustomType.MATHESAR_JSON_ARRAY,
        MathesarCustomType.MATHESAR_JSON_OBJECT,
    ]
    if source_type not in default_unsupported and target_type not in default_unsupported:
        in_sel = select(cast(cast(in_val, source_sa_type), VARCHAR))
        with engine.begin() as conn:
            processed_in_val = conn.execute(in_sel).scalar()
    else:
        processed_in_val = None

    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(
            COLUMN_NAME,
            source_sa_type,
            server_default=processed_in_val
        ),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert().values(testcol=in_val)
    with engine.begin() as conn:
        conn.execute(ins)
        alter_column_type(
            get_oid_from_table(TABLE_NAME, schema, engine),
            COLUMN_NAME,
            engine,
            conn,
            target_type
        )
    metadata = MetaData(bind=engine)
    metadata.reflect()
    actual_table = Table(TABLE_NAME, metadata, schema=schema, autoload_with=engine)
    sel = actual_table.select()
    with engine.connect() as conn:
        res = conn.execute(sel).fetchall()
    actual_value = res[0][0]
    assert actual_value == out_val
    table_oid = get_oid_from_table(TABLE_NAME, schema, engine)
    column_attnum = get_column_attnum_from_name(table_oid, COLUMN_NAME, engine)
    actual_default = get_column_default(table_oid, column_attnum, engine)
    # TODO This needs to be sorted out by fixing how server_default is set.
    if source_type not in default_unsupported and target_type not in default_unsupported:
        assert actual_default == out_val


type_test_bad_data_gen_list = [
    (
        source_type,
        target_type,
        data,
    )
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items()
    for target_type in val[TARGET_DICT]
    for data in val[TARGET_DICT][target_type].get(INVALID, [])
]


@pytest.mark.parametrize(
    "source_type,target_type,value", type_test_bad_data_gen_list
)
def test_alter_column_type_raises_on_bad_column_data(
        engine_with_schema, source_type, target_type, value,
):
    engine, schema = engine_with_schema
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    source_sa_type = source_type.get_sa_class(engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, source_sa_type),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(value,))
    with engine.begin() as conn:
        conn.execute(ins)
        with pytest.raises(Exception):
            alter_column_type(
                get_oid_from_table(TABLE_NAME, schema, engine),
                COLUMN_NAME,
                engine,
                conn,
                target_type
            )


def test_alter_column_type_raises_on_bad_parameters(
        engine_with_schema,
):
    engine, schema = engine_with_schema
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, NUMERIC),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(5.3,))
    bad_options = {"precision": 3, "scale": 4}  # scale must be smaller than precision
    with engine.begin() as conn:
        conn.execute(ins)
        with pytest.raises(DataError) as e:
            alter_column_type(
                get_oid_from_table(TABLE_NAME, schema, engine),
                COLUMN_NAME,
                engine,
                conn,
                PostgresType.NUMERIC,
                bad_options
            )
            assert e.orig == InvalidParameterValue


def test_get_column_cast_expression_unchanged(engine_with_schema):
    engine, _ = engine_with_schema
    target_type = PostgresType.NUMERIC
    col_name = "my_column"
    column = Column(col_name, NUMERIC)
    cast_expr = cast_operations.get_column_cast_expression(
        column, target_type, engine
    )
    assert cast_expr == column


def test_get_column_cast_expression_change(engine_with_schema):
    engine, _ = engine_with_schema
    target_type = PostgresType.BOOLEAN
    col_name = "my_column"
    column = Column(col_name, NUMERIC)
    cast_expr = cast_operations.get_column_cast_expression(
        column, target_type, engine
    )
    assert str(cast_expr) == f"mathesar_types.cast_to_boolean({col_name})"


def test_get_column_cast_expression_change_quotes(engine_with_schema):
    engine, _ = engine_with_schema
    target_type = PostgresType.BOOLEAN
    col_name = "A Column Needing Quotes"
    column = Column(col_name, NUMERIC)
    cast_expr = cast_operations.get_column_cast_expression(
        column, target_type, engine
    )
    assert str(cast_expr) == f'mathesar_types.cast_to_boolean("{col_name}")'


def test_get_column_cast_expression_unsupported(engine_without_ischema_names_updated):
    engine = engine_without_ischema_names_updated
    target_type = MathesarCustomType.URI
    column = Column("colname", NUMERIC)
    with pytest.raises(cast_operations.UnsupportedTypeException):
        cast_operations.get_column_cast_expression(
            column, target_type, engine
        )


cast_expr_numeric_option_list = [
    (
        PostgresType.NUMERIC,
        PostgresType.NUMERIC,
        {"precision": 3},
        'CAST(colname AS NUMERIC(3))',
    ),
    (
        PostgresType.NUMERIC,
        PostgresType.NUMERIC,
        {"precision": 3, "scale": 2},
        'CAST(colname AS NUMERIC(3, 2))',
    ),
    (
        PostgresType.NUMERIC,
        PostgresType.NUMERIC,
        {"precision": 3, "scale": 2},
        'CAST(colname AS NUMERIC(3, 2))',
    ),
    (
        PostgresType.CHARACTER_VARYING,
        PostgresType.NUMERIC,
        {"precision": 3, "scale": 2},
        'CAST(mathesar_types.cast_to_numeric(colname) AS NUMERIC(3, 2))',
    ),
    (
        PostgresType.INTERVAL,
        PostgresType.INTERVAL,
        {"fields": "YEAR"},
        "CAST(colname AS INTERVAL YEAR)",
    ),
    (
        PostgresType.INTERVAL,
        PostgresType.INTERVAL,
        {"precision": 2},
        "CAST(colname AS INTERVAL (2))",
    ),
    (
        PostgresType.INTERVAL,
        PostgresType.INTERVAL,
        {"precision": 3, "fields": "SECOND"},
        "CAST(colname AS INTERVAL SECOND (3))",
    ),
    (
        PostgresType.CHARACTER_VARYING,
        PostgresType.INTERVAL,
        {"precision": 3, "fields": "SECOND"},
        "CAST(mathesar_types.cast_to_interval(colname) AS INTERVAL SECOND (3))",
    )
]


@pytest.mark.parametrize(
    "source_type,target_type,options,expect_cast_expr", cast_expr_numeric_option_list
)
def test_get_column_cast_expression_type_options(
        engine_with_schema, source_type, target_type, options, expect_cast_expr
):
    engine, _ = engine_with_schema
    source_sa_type = source_type.get_sa_class(engine)
    column = Column("colname", source_sa_type)
    cast_expr = cast_operations.get_column_cast_expression(
        column, target_type, engine, type_options=options,
    )
    actual_cast_expr = str(cast_expr.compile(engine))
    assert actual_cast_expr == expect_cast_expr


expect_cast_tuples = [
    (source_type, [target_type for target_type in val[TARGET_DICT]])
    for source_type, val in MASTER_DB_TYPE_MAP_SPEC.items()
]


@pytest.mark.parametrize("source_type,expect_target_types", expect_cast_tuples)
def test_get_full_cast_map(engine_with_schema, source_type, expect_target_types):
    engine, _ = engine_with_schema
    actual_cast_map = cast_operations.get_full_cast_map(engine)
    actual_target_types = actual_cast_map[source_type]
    assert set(actual_target_types) == set(expect_target_types)


money_array_examples = [
    ('$1,000.00', ['1,000.00', ',', '.', '$']),
    ('1,000.00$', ['1,000.00', ',', '.', '$']),
    ('$1', ['1', None, None, '$']),
    ('1$', ['1', None, None, '$']),
    ('$ 1', ['1', None, None, '$ ']),
    ('1', None),
    ('1,000', None),
    ('1,000.00', None),
    ('$1,000', None),
    ('$1,000,000', ['1,000,000', ',', None, '$']),
    ('$1,234,567.1234', ['1,234,567.1234', ',', '.', '$']),
    ('1,000,000$', ['1,000,000', ',', None, '$']),
    ('$1 000,000', ['1 000,000', ' ', ',', '$']),
    ('1 000,000$', ['1 000,000', ' ', ',', '$']),
    ('1.000,000$', ['1.000,000', '.', ',', '$']),
    ('$1.000,00 HK', ['1.000,00', '.', ',', '$ HK']),
    ('EUR 1.000,00', ['1.000,00', '.', ',', 'EUR ']),
    ('€1.000,00', ['1.000,00', '.', ',', '€']),
    ('1.000,00€', ['1.000,00', '.', ',', '€']),
    ('€1 000', ['1 000', ' ', None, '€']),
    ('1 000€', ['1 000', ' ', None, '€']),
    ('₿1,324.23466 BTC', ['1,324.23466', ',', '.', '₿ BTC']),
    ('12₿1,324.23466 BTC', None),
    ('₿1,324.23466 BTC12', None),
    ('₹1,00,000', ['1,00,000', ',', None, '₹']),
    ('1,00,000₹', ['1,00,000', ',', None, '₹']),
    ('₹1,00,000.00', ['1,00,000.00', ',', '.', '₹']),
    ('1,00,000.00₹', ['1,00,000.00', ',', '.', '₹']),
    ('10,00,000.00₹', ['10,00,000.00', ',', '.', '₹']),
    ('₹10,00,00,000.00', ['10,00,00,000.00', ',', '.', '₹']),
    ('10,00,00,000.00₹', ['10,00,00,000.00', ',', '.', '₹']),
]


@pytest.mark.parametrize("source_str,expect_arr", money_array_examples)
def test_mathesar_money_array_sql(engine_with_schema, source_str, expect_arr):
    engine, _ = engine_with_schema
    with engine.begin() as conn:
        res = conn.execute(
            select(
                text(f"mathesar_types.get_mathesar_money_array('{source_str}'::text)")
            )
        ).scalar()
    assert res == expect_arr


numeric_array_examples = [
    ('3.14', ['3.14', None, '.']),
    ('331,209.00', ['331,209.00', ',', '.']),
    ('1,234,567.8910', ['1,234,567.8910', ',', '.']),
    ('-1,234,567.8910', ['1,234,567.8910', ',', '.']),
    ('3,14', ['3,14', None, ',']),
    ('331.293,00', ['331.293,00', '.', ',']),
    ('1.234.567,8910', ['1.234.567,8910', '.', ',']),
    ('331 293,00', ['331 293,00', ' ', ',']),
    ('1 234 567,8910', ['1 234 567,8910', ' ', ',']),
    ('-1 234 567,8910', ['1 234 567,8910', ' ', ',']),
    ('1,23,45,678.910', ['1,23,45,678.910', ',', '.']),
    ('1\'\'234\'\'567.8910', ['1\'234\'567.8910', '\'', '.']),
]


@pytest.mark.parametrize("source_str,expect_arr", numeric_array_examples)
def test_numeric_array_sql(engine_with_schema, source_str, expect_arr):
    engine, _ = engine_with_schema
    with engine.begin() as conn:
        res = conn.execute(
            select(
                text(f"mathesar_types.get_numeric_array('{source_str}'::text)")
            )
        ).scalar()
    assert res == expect_arr
