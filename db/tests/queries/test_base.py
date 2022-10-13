from db.queries.base import DBQuery, InitialColumn
from db.columns.operations.select import get_column_attnum_from_name as get_attnum
from db.tables.operations.select import get_oid_from_table
from db.transforms import base as tbase
from db.metadata import get_empty_metadata


def _extract_col_properties_dict(col):
    return {
        "name": col.name,
        "type": col.db_type.id,
    }


def test_DBQuery_all_sa_columns_map_initial_columns(engine_with_academics):
    engine, schema = engine_with_academics
    acad_oid = get_oid_from_table("academics", schema, engine)
    initial_columns = [
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'id', engine, metadata=get_empty_metadata()),
            alias='id',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'institution', engine, metadata=get_empty_metadata()),
            alias='institution',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=get_empty_metadata()),
            alias='advisor name',
            jp_path=[
                [
                    (acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=get_empty_metadata())),
                    (acad_oid, get_attnum(acad_oid, 'id', engine, metadata=get_empty_metadata())),
                ]
            ],
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=get_empty_metadata()),
            alias='advisee name',
            jp_path=[
                [
                    (acad_oid, get_attnum(acad_oid, 'id', engine, metadata=get_empty_metadata())),
                    (acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=get_empty_metadata())),
                ]
            ],
        ),
    ]
    dbq = DBQuery(
        acad_oid,
        initial_columns,
        engine
    )
    expect_columns = {
        'id': {'name': 'id', 'type': 'integer'},
        'institution': {'name': 'institution', 'type': 'integer'},
        'advisor name': {'name': 'advisor name', 'type': 'text'},
        'advisee name': {'name': 'advisee name', 'type': 'text'}
    }
    actual_columns = {
        k: _extract_col_properties_dict(v)
        for k, v in dbq.all_sa_columns_map.items()
    }
    assert actual_columns == expect_columns


def test_DBQuery_all_sa_columns_map_output_columns(engine_with_academics):
    engine, schema = engine_with_academics
    acad_oid = get_oid_from_table("academics", schema, engine)
    initial_columns = [
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'id', engine, metadata=get_empty_metadata()),
            alias='id',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'institution', engine, metadata=get_empty_metadata()),
            alias='institution',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=get_empty_metadata()),
            alias='advisor name',
            jp_path=[
                [
                    (acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=get_empty_metadata())),
                    (acad_oid, get_attnum(acad_oid, 'id', engine, metadata=get_empty_metadata())),
                ]
            ],
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=get_empty_metadata()),
            alias='advisee name',
            jp_path=[
                [
                    (acad_oid, get_attnum(acad_oid, 'id', engine, metadata=get_empty_metadata())),
                    (acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=get_empty_metadata())),
                ]
            ],
        ),
    ]
    transformations = [
        tbase.Filter(
            spec={
                "equal": [
                    {"column_name": ["advisee name"]}, {"literal": ["John Doe"]}
                ]
            }
        )
    ]
    dbq = DBQuery(
        acad_oid,
        initial_columns,
        engine,
        transformations=transformations,
    )
    expect_columns = {
        'id': {'name': 'id', 'type': 'integer'},
        'institution': {'name': 'institution', 'type': 'integer'},
        'advisor name': {'name': 'advisor name', 'type': 'text'},
        'advisee name': {'name': 'advisee name', 'type': 'text'}
    }
    actual_columns = {
        k: _extract_col_properties_dict(v)
        for k, v in dbq.all_sa_columns_map.items()
    }
    assert actual_columns == expect_columns


def test_DBQuery_all_sa_columns_map_summarized_columns(engine_with_library):
    engine, schema = engine_with_library
    checkouts_oid = get_oid_from_table("Checkouts", schema, engine)
    initial_columns = [
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'id', engine, metadata=get_empty_metadata()),
            alias='Checkouts id'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Item', engine, metadata=get_empty_metadata()),
            alias='Collection items'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Patron', engine, metadata=get_empty_metadata()),
            alias='Library patron'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Due Date', engine, metadata=get_empty_metadata()),
            alias='Due Date'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Checkout Time', engine, metadata=get_empty_metadata()),
            alias='Checkout Time'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Check In Time', engine, metadata=get_empty_metadata()),
            alias='Check In Time'
        )
    ]
    transformations = [
        tbase.Filter(
            spec={"lesser": [{"column_name": ["Due Date"]}, {"literal": ["2022-08-10"]}]}
        ),
        tbase.Filter(
            spec={"empty": [{"column_name": ["Check In Time"]}]}
        ),
        tbase.Summarize(
            spec={
                "grouping_expressions": [
                    {
                        "input_alias": "Checkout Time",
                        "output_alias": "Checkout Month",
                        "preproc": "truncate_to_month",
                    }
                ],
                "aggregation_expressions": [
                    {
                        "input_alias": "Checkouts id",
                        "output_alias": "Overdue Checkouts",
                        "function": "count"
                    }
                ]
            }
        )
    ]
    dbq = DBQuery(
        checkouts_oid,
        initial_columns,
        engine,
        transformations=transformations,
    )
    expect_columns = {
        'Checkouts id': {'name': 'Checkouts id', 'type': 'integer'},
        'Collection items': {'name': 'Collection items', 'type': 'integer'},
        'Library patron': {'name': 'Library patron', 'type': 'integer'},
        'Due Date': {'name': 'Due Date', 'type': 'date'},
        'Checkout Time': {'name': 'Checkout Time', 'type': 'timestamp without time zone'},
        'Check In Time': {'name': 'Check In Time', 'type': 'timestamp without time zone'},
        'Checkout Month': {'name': 'Checkout Month', 'type': 'text'},
        'Overdue Checkouts': {'name': 'Overdue Checkouts', 'type': 'integer'}
    }
    actual_columns = {
        k: _extract_col_properties_dict(v)
        for k, v in dbq.all_sa_columns_map.items()
    }
    assert actual_columns == expect_columns


def test_DBQuery_all_sa_columns_map_overwriting(engine_with_library):
    engine, schema = engine_with_library
    checkouts_oid = get_oid_from_table("Checkouts", schema, engine)
    initial_columns = [
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'id', engine, metadata=get_empty_metadata()),
            alias='Checkout'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Item', engine, metadata=get_empty_metadata()),
            alias='Collection items'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Patron', engine, metadata=get_empty_metadata()),
            alias='Library patron'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Due Date', engine, metadata=get_empty_metadata()),
            alias='Due Date'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Checkout Time', engine, metadata=get_empty_metadata()),
            alias='Checkout Time'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Check In Time', engine, metadata=get_empty_metadata()),
            alias='Check In Time'
        )
    ]
    transformations = [
        tbase.Summarize(
            spec={
                "grouping_expressions": [
                    {
                        "input_alias": "Checkout Time",
                        "output_alias": "Checkout Month",
                        "preproc": "truncate_to_month",
                    }
                ],
                "aggregation_expressions": [
                    {
                        "input_alias": "Checkout",
                        "output_alias": "Checkout",
                        "function": "count"
                    },
                    {
                        "input_alias": "Due Date",
                        "output_alias": "Due Date",
                        "function": "count"
                    },
                    {
                        "input_alias": "Checkout",
                        "output_alias": "Checkout_arr",
                        "function": "aggregate_to_array"
                    },
                ]
            }
        ),
        tbase.Summarize(
            spec={
                "grouping_expressions": [
                    {
                        "input_alias": "Checkout",
                        "output_alias": "Checkout",
                    }
                ],
                "aggregation_expressions": [
                    {
                        "input_alias": "Checkout Month",
                        "output_alias": "Checkout Month",
                        "function": "count"
                    }
                ]
            }
        )
    ]
    dbq = DBQuery(
        checkouts_oid,
        initial_columns,
        engine,
        transformations=transformations,
    )
    expect_columns = {
        'Checkout': {'name': 'Checkout', 'type': 'integer'},
        'Collection items': {'name': 'Collection items', 'type': 'integer'},
        'Library patron': {'name': 'Library patron', 'type': 'integer'},
        'Due Date': {'name': 'Due Date', 'type': 'integer'},
        'Checkout Time': {'name': 'Checkout Time', 'type': 'timestamp without time zone'},
        'Check In Time': {'name': 'Check In Time', 'type': 'timestamp without time zone'},
        'Checkout Month': {'name': 'Checkout Month', 'type': 'integer'},
        'Checkout_arr': {'name': 'Checkout_arr', 'type': '_array'}
    }
    actual_columns = {
        k: _extract_col_properties_dict(v)
        for k, v in dbq.all_sa_columns_map.items()
    }
    assert actual_columns == expect_columns
