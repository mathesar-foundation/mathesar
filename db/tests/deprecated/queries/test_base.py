from sqlalchemy import inspect, text
from db.deprecated.queries.base import DBQuery, InitialColumn, JoinParameter
from db.deprecated.columns import get_column_attnum_from_name as get_attnum
from db.deprecated.transforms import base as tbase
from db.deprecated.metadata import get_empty_metadata
from db.deprecated.utils import engine_to_psycopg_conn
from mathesar.utils.explorations import run_exploration


def _extract_col_properties_dict(col):
    return {
        "name": col.name,
        "type": col.db_type.id,
    }


def _get_oid_from_table(name, schema, engine):
    inspector = inspect(engine)
    return inspector.get_table_oid(name, schema=schema)


def _get_oid_from_schema(schema_name, engine):
    with engine.connect() as conn:
        return conn.execute(
            text(f"SELECT oid FROM pg_namespace WHERE nspname = '{schema_name}'"),
        ).fetchone()


def test_DBQuery_all_sa_columns_map_initial_columns(engine_with_academics):
    engine, schema = engine_with_academics
    acad_oid = _get_oid_from_table("academics", schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'id', engine, metadata=metadata),
            alias='id',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'institution', engine, metadata=metadata),
            alias='institution',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=metadata),
            alias='advisor name',
            jp_path=[
                JoinParameter(
                    acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=metadata),
                    acad_oid, get_attnum(acad_oid, 'id', engine, metadata=metadata),
                )
            ],
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=metadata),
            alias='advisee name',
            jp_path=[
                JoinParameter(
                    acad_oid, get_attnum(acad_oid, 'id', engine, metadata=metadata),
                    acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=metadata),
                )
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
    acad_oid = _get_oid_from_table("academics", schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'id', engine, metadata=metadata),
            alias='id',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'institution', engine, metadata=metadata),
            alias='institution',
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=metadata),
            alias='advisor name',
            jp_path=[
                JoinParameter(
                    acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=metadata),
                    acad_oid, get_attnum(acad_oid, 'id', engine, metadata=metadata),
                )
            ],
        ),
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'name', engine, metadata=metadata),
            alias='advisee name',
            jp_path=[
                JoinParameter(
                    acad_oid, get_attnum(acad_oid, 'id', engine, metadata=metadata),
                    acad_oid, get_attnum(acad_oid, 'advisor', engine, metadata=metadata),
                )
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
    checkouts_oid = _get_oid_from_table("Checkouts", schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'id', engine, metadata=metadata),
            alias='Checkouts id'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Item', engine, metadata=metadata),
            alias='Collection items'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Patron', engine, metadata=metadata),
            alias='Library patron'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Due Date', engine, metadata=metadata),
            alias='Due Date'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Checkout Time', engine, metadata=metadata),
            alias='Checkout Time'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Check In Time', engine, metadata=metadata),
            alias='Check In Time'
        )
    ]
    transformations = [
        tbase.Filter(
            spec={"lesser": [{"column_name": ["Due Date"]}, {"literal": ["2022-08-10"]}]}
        ),
        tbase.Filter(
            spec={"null": [{"column_name": ["Check In Time"]}]}
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
    checkouts_oid = _get_oid_from_table("Checkouts", schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'id', engine, metadata=metadata),
            alias='Checkout'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Item', engine, metadata=metadata),
            alias='Collection items'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Patron', engine, metadata=metadata),
            alias='Library patron'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Due Date', engine, metadata=metadata),
            alias='Due Date'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Checkout Time', engine, metadata=metadata),
            alias='Checkout Time'
        ),
        InitialColumn(
            checkouts_oid,
            get_attnum(checkouts_oid, 'Check In Time', engine, metadata=metadata),
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
                        "function": "distinct_aggregate_to_array"
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


def test_run_explorations(db, engine_with_library):
    # This test exists to make sure we're able to run explorations with both TCP & Unix socket connections to postgres.
    engine, schema = engine_with_library
    schema_oid = _get_oid_from_schema(schema, engine)
    checkouts_oid = _get_oid_from_table("Checkouts", schema, engine)
    items_oid = _get_oid_from_table("Items", schema, engine)
    conn = engine_to_psycopg_conn(engine)
    exploration_def = {
        "database_id": 1,
        "schema_oid": schema_oid,
        "base_table_oid": checkouts_oid,
        "initial_columns": [
            {
                "alias": "Checkouts_Due Date",
                "attnum": 5
            },
            {
                "alias": "Items_Acquisition Date",
                "attnum": 3,
                "join_path": [
                    [
                        [
                            checkouts_oid,
                            2
                        ],
                        [
                            items_oid,
                            1
                        ]
                    ]
                ]
            }
        ],
        "transformations": [],
        "display_names": {
            "Checkouts_Due Date": "Checkouts_Due Date",
            "Items_Acquisition Price": "Items_Acquisition Price",
            "Items_Acquisition Date": "Items_Acquisition Date"
        },
        "display_options": {
            "columnDisplayOptions": {}
        }
    }
    with conn:
        actual_results = run_exploration(exploration_def, conn, limit=1, offset=0)
    expected_results = {
        'count': 104,
        'results': [
            {
                'Checkouts_Due Date': '2022-05-16 AD',
                'Items_Acquisition Date': '2014-05-16 AD'
            }
        ]
    }
    assert expected_results == actual_results['records']
