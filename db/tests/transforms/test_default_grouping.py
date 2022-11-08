from db.tables.operations.select import get_oid_from_table
from db.queries.base import DBQuery, InitialColumn
from db.metadata import get_empty_metadata
from db.transforms.base import Summarize
from db.columns.operations.select import get_column_attnum_from_name as get_attnum
from db.transforms.operations.finish_specifying import finish_specifying_summarize_transform


def test_empty_spec(engine_with_academics):
    engine, schema = engine_with_academics
    metadata = get_empty_metadata()

    # oids and attnums
    acad_oid = get_oid_from_table('academics', schema, engine)
    acad_id_attnum = get_attnum(acad_oid, 'id', engine, metadata=metadata)
    acad_name_attnum = get_attnum(acad_oid, 'name', engine, metadata=metadata)
    acad_insitution_attnum = get_attnum(acad_oid, 'institution', engine, metadata=metadata)
    uni_oid = get_oid_from_table('universities', schema, engine)
    uni_name_attnum = get_attnum(uni_oid, 'name', engine, metadata=metadata)
    uni_id_attnum = get_attnum(uni_oid, 'id', engine, metadata=metadata)
    arti_oid = get_oid_from_table('articles', schema, engine)
    arti_title_attnum = get_attnum(arti_oid, 'title', engine, metadata=metadata)
    arti_prim_author_attnum = get_attnum(arti_oid, 'primary_author', engine, metadata=metadata)

    # aliases
    acad_id_alias = 'acad_id'
    acad_name_alias = 'acad_name'
    uni_name_alias = 'uni_name'
    arti_title_alias = 'arti_title'

    initial_columns = [
        # Serves as user-selected, unique-constrained column
        InitialColumn(
            acad_oid,
            acad_id_attnum,
            alias=acad_id_alias,
        ),
        # Serves as initial column on same table as user-selected column
        InitialColumn(
            acad_oid,
            acad_name_attnum,
            alias=acad_name_alias,
        ),
        # Serves as a "single result" initial column
        InitialColumn(
            uni_oid,
            uni_name_attnum,
            alias=uni_name_alias,
            jp_path=[
                [
                    (acad_oid, acad_insitution_attnum),
                    (uni_oid, uni_id_attnum),
                ],
            ],
        ),
        # Serves as a "multiple result" initial column
        InitialColumn(
            arti_oid,
            arti_title_attnum,
            alias=arti_title_alias,
            jp_path=[
                [
                    (acad_oid, acad_id_attnum),
                    (arti_oid, arti_prim_author_attnum),
                ],
            ],
        ),
    ]

    # default output alias suffixes
    group_output_alias_suffix = Summarize.default_group_output_alias_suffix
    agg_output_alias_suffix = Summarize.default_agg_output_alias_suffix

    partial_summarize_transform = Summarize(
        dict(
            base_grouping_column=acad_id_alias,
            grouping_expressions=[],
            aggregation_expressions=[]
        )
    )
    transforms = [partial_summarize_transform]
    ix_of_summarize_transform = 0
    base_table_oid = acad_oid
    db_query = DBQuery(
        base_table_oid=base_table_oid,
        initial_columns=initial_columns,
        engine=engine,
        transformations=transforms,
    )

    complete_summarize_transform = \
        finish_specifying_summarize_transform(db_query, ix_of_summarize_transform, engine, metadata)
    expected_summarize_transform = Summarize(
        dict(
            base_grouping_column=acad_id_alias,
            grouping_expressions=[
                dict(
                    input_alias=acad_id_alias,
                    output_alias=acad_id_alias + group_output_alias_suffix,
                ),
                dict(
                    input_alias=acad_name_alias,
                    output_alias=acad_name_alias + group_output_alias_suffix,
                ),
                dict(
                    input_alias=uni_name_alias,
                    output_alias=uni_name_alias + group_output_alias_suffix,
                ),
            ],
            aggregation_expressions=[
                dict(
                    input_alias=arti_title_alias,
                    output_alias=arti_title_alias + agg_output_alias_suffix,
                    function="aggregate_to_array",
                ),
            ]
        )
    )
    assert complete_summarize_transform == expected_summarize_transform
