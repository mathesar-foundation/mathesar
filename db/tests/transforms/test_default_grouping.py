from db.tables.operations.select import get_oid_from_table, get_joinable_tables
from db.queries.base import DBQuery, InitialColumn
from db.metadata import get_empty_metadata
from db.transforms.base import Summarize, SelectSubsetOfColumns
from db.columns.operations.select import (
    get_column_attnum_from_name as get_attnum,
    get_column_from_oid_and_attnum,
)


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


def finish_specifying_summarize_transform(db_query, ix_of_summarize_transform, engine, metadata):
    """
    Will find initial columns that are not mentioned in the summarize_transform and will add each
    of them to its grouping set and/or aggregating set.

    If the user selected initial column (summarize's base grouping column) is not unique
    constrained, will put the unmentioned initial columns in the aggregation set.

    If the user selected initial column (summarize's base grouping column) is unique, then it might
    put the initial column in the grouping set, depending on what _should_group_by returns.
    """
    summarize_transform = db_query.transformations[ix_of_summarize_transform]
    assert type(summarize_transform) is Summarize
    initial_columns_not_in_summarize = _get_initial_columns_not_in_summarize(db_query, summarize_transform)
    if not initial_columns_not_in_summarize:
        # If all input aliases for this transform are mentioned in the group-agg transform spec, we
        # consider it fully specified.
        return summarize_transform
    # A group-agg transform has a base_grouping_column, or a user-selected input alias around
    # which our suggestions will be based.
    user_selected_alias = summarize_transform.base_grouping_column
    user_selected_initial_column = _get_initial_column_by_alias(db_query.initial_columns, user_selected_alias)
    # When we'll have finished specifying this group-agg transform, each input alias not already
    # mentioned in it, will be added either to its "group by set" or its "aggregate on set"
    aliases_to_be_added_to_group_by = []
    aliases_to_be_added_to_agg_on = []
    # Most of logic in the rest of method is around whether or not we can add a given input alias
    # to the "group by set"
    can_we_add_to_group_by = (
        _is_first_alias_generating_transform(db_query, ix_of_summarize_transform)
        and _is_initial_column_unique_constrained(user_selected_initial_column, engine, metadata)
    )
    if can_we_add_to_group_by:
        oids_of_joinable_tables_with_single_results = _get_oids_of_joinable_tables_with_single_results(db_query, engine, metadata)
        oid_of_user_selected_initial_column = _get_oid_of_initial_column(user_selected_initial_column)
        for initial_column in initial_columns_not_in_summarize:
            if _should_group_by(
                _get_oid_of_initial_column(initial_column),
                oid_of_user_selected_initial_column,
                oids_of_joinable_tables_with_single_results,
            ):
                alias_set_to_add_to = aliases_to_be_added_to_group_by
            else:
                alias_set_to_add_to = aliases_to_be_added_to_agg_on
            alias_set_to_add_to.append(initial_column.alias)
    else:
        aliases_to_be_added_to_agg_on = list(
            initial_column.alias
            for initial_column
            in initial_columns_not_in_summarize
        )
    summarize_transform = summarize_transform.add_aliases_to_agg_on(aliases_to_be_added_to_agg_on)
    summarize_transform = summarize_transform.add_aliases_to_group_by(aliases_to_be_added_to_group_by)
    return summarize_transform


def _is_first_alias_generating_transform(db_query, ix_of_summarize_transform):
    """
    Checks if the transform is the first alias-generating transform. An alias-generating transform
    means that it itroduces new aliases (columns) to the transform pipeline. We want to know when
    a given alias-generating transform is the first in the pipeline, because then we can consider
    its input aliases to be fully described by initial columns, which can be a useful
    simplification.
    """
    prior_transforms = db_query.transformations[:ix_of_summarize_transform]
    for prior_transform in prior_transforms:
        alias_generating_transforms = {Summarize, SelectSubsetOfColumns}
        is_alias_generating = type(prior_transform) in alias_generating_transforms
        if is_alias_generating:
            return False
    return True


def _get_initial_columns_not_in_summarize(db_query, summarize_transform):
    initial_columns = db_query.initial_columns
    group_by_aliases = summarize_transform.grouping_input_aliases
    agg_on_aliases = summarize_transform.aggregation_input_aliases
    aliases_in_summarize = group_by_aliases + agg_on_aliases
    return [
        initial_column
        for initial_column in
        initial_columns
        if initial_column.alias not in aliases_in_summarize
    ]


def _get_initial_column_by_alias(initial_columns, alias):
    for initial_column in initial_columns:
        if initial_column.alias == alias:
            return initial_column


def _should_group_by(
    oid_of_initial_column,
    oid_of_user_selected_group_by_col,
    oids_of_joinable_tables_with_single_results,
):
    """
    For the sake of efficiency, we're not checking here that user_selected_group_by_col is unique
    constrained: it is presumed that that is the case.
    """
    is_on_table_of_user_selected_column = oid_of_initial_column == oid_of_user_selected_group_by_col
    is_single_result = oid_of_initial_column in oids_of_joinable_tables_with_single_results
    should_group_by = is_on_table_of_user_selected_column or is_single_result
    return should_group_by


def _get_oids_of_joinable_tables_with_single_results(db_query, engine, metadata):
    joinable_tables = get_joinable_tables(engine, metadata, db_query.base_table_oid)
    return set(
        _get_oid_of_joinable_table(joinable_table)
        for joinable_table
        in joinable_tables
        if _has_single_result(joinable_table)
    )


def _is_initial_column_unique_constrained(initial_column, engine, metadata):
    oid = _get_oid_of_initial_column(initial_column)
    attnum = initial_column.attnum
    sa_column = get_column_from_oid_and_attnum(
        table_oid=oid,
        attnum=attnum,
        engine=engine,
        metadata=metadata,
    )
    return _is_sa_column_unique_constrained(sa_column)


def _is_sa_column_unique_constrained(sa_column):
    return sa_column.primary_key or sa_column.unique


def _get_oid_of_initial_column(initial_column):
    return initial_column.reloid


def _get_oid_of_joinable_table(joinable_table):
    joinable_table_oid = joinable_table[1]
    return joinable_table_oid


def _has_single_result(joinable_table):
    # wish joinable_table were something addressable with symbols, like namedtuple or data class
    has_multiple_results = joinable_table[5]
    assert type(has_multiple_results) is bool
    return not has_multiple_results
