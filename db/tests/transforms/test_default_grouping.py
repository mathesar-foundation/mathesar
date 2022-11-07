import pytest
from db.columns.operations.select import get_column_attnum_from_name as get_attnum
from db.tables.operations.select import get_oid_from_table
from db.queries.base import DBQuery, InitialColumn
from db.metadata import get_empty_metadata

# TODO
# db_query fixture that has initial columns that
# - are single result
# - are on table of user selected column


@pytest.fixture
def some_fixture(engine_with_academics):
    engine, schema = engine_with_academics
    metadata = get_empty_metadata()
    acad_oid = get_oid_from_table('academics', schema, engine)
    acad_id_attnum = get_attnum(acad_oid, 'id', engine, metadata=metadata)
    acad_insitution_attnum = get_attnum(acad_oid, 'institution', engine, metadata=metadata)
    uni_oid = get_oid_from_table('universities', schema, engine)
    uni_name_attnum = get_attnum(uni_oid, 'name', engine, metadata=metadata)
    uni_id_attnum = get_attnum(uni_oid, 'id', engine, metadata=metadata)
    arti_oid = get_oid_from_table('articles', schema, engine)
    arti_title_attnum = get_attnum(arti_oid, 'title', engine, metadata=metadata)
    arti_prim_author_attnum = get_attnum(arti_oid, 'primary_author', engine, metadata=metadata)
    initial_columns = [
        InitialColumn(
            acad_oid,
            acad_id_attnum,
            alias='id',
        ),
        # Serves as a "single result" initial column
        InitialColumn(
            uni_oid,
            uni_name_attnum,
            alias='institution_name',
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
            alias='article_title',
            jp_path=[
                [
                    (acad_oid, acad_id_attnum),
                    (arti_oid, arti_prim_author_attnum),
                ],
            ],
        ),
    ]
    base_table_oid = acad_oid
    dbq = DBQuery(
        base_table_oid,
        initial_columns,
        engine
    )
    return dbq


def test_x(engine_with_academics):
    from db.tables.operations.select import get_joinable_tables
    from db.metadata import get_empty_metadata
    engine, schema = engine_with_academics
    metadata = get_empty_metadata()
    base_table_oid = get_oid_from_table('academics', schema, engine)
    joinable_tables = get_joinable_tables(engine, metadata, base_table_oid)
    breakpoint()
    db_query = some_fixture
    user_selected_group_by_initial_column = db_query.initial_columns[5]
    group_agg_transform = object # TODO
    finish_specifying_group_agg_transform(db_query, group_agg_transform, engine, metadata)
    expected_group_by_columns = set()
    expected_agg_on_columns = set()
    assert group_agg_transform.group_by_columns == expected_group_by_columns
    assert group_agg_transform.agg_on_columns == expected_group_by_columns


# TODO make a copy of group_agg_transform, instead of mutating it
def finish_specifying_group_agg_transform(db_query, group_agg_transform, engine, metadata):
    """
    Will find initial columns that are not mentioned in the group_agg_transform and will add each
    of them to its grouping set and/or aggregating set.

    If the user selected initial column (group_agg's base grouping column) is not unique
    constrained, will put the unmentioned initial columns in the aggregation set.

    If the user selected initial column (group_agg's base grouping column) is unique, then it might
    put the initial column in the grouping set, depending on what _should_group_by returns.
    """
    initial_columns_not_in_group_agg = _get_initial_columns_not_in_group_agg(db_query, group_agg_transform)
    if not initial_columns_not_in_group_agg:
        return group_agg_transform
    alias_of_user_selected_initial_column = group_agg_transform.base_grouping_column
    user_selected_initial_column = _get_initial_column_by_alias(db_query.initial_columns, alias_of_user_selected_initial_column)
    aliases_to_be_added_to_group_by = set()
    if _is_unique_constrained(user_selected_initial_column):
        aliases_to_be_added_to_agg_on = set()
        oids_of_joinable_tables_with_single_results = _get_oids_of_joinable_tables_with_single_results(db_query, engine, metadata)
        oid_of_table_of_user_selected_initial_column = _get_oid_of_table_of_initial_column(user_selected_initial_column)
        for initial_column in initial_columns_not_in_group_agg:
            if _should_group_by(
                _get_oid_of_table_of_initial_column(initial_column),
                oid_of_table_of_user_selected_initial_column,
                oids_of_joinable_tables_with_single_results,
            ):
                alias_set_to_add_to = aliases_to_be_added_to_group_by
            else:
                alias_set_to_add_to = aliases_to_be_added_to_agg_on
            alias_set_to_add_to.add(initial_column.alias)
    else:
        aliases_to_be_added_to_agg_on = set(
            initial_column.alias
            for initial_column
            in initial_columns_not_in_group_agg
        )
    group_agg_transform = _add_aliases_to_agg_on(group_agg_transform, aliases_to_be_added_to_agg_on)
    group_agg_transform = _add_aliases_to_group_by(group_agg_transform, aliases_to_be_added_to_group_by)
    return group_agg_transform


# TODO
def _add_aliases_to_group_by(group_agg_transform, aliases):
    return


# TODO
def _add_aliases_to_agg_on(group_agg_transform, aliases):
    return


def _get_initial_columns_not_in_group_agg(db_query, group_agg_transform):
    initial_columns = db_query.initial_columns
    group_by_aliases = _get_group_by_aliases(group_agg_transform)
    agg_on_aliases = _get_agg_on_aliases(group_agg_transform)
    aliases_in_group_agg = set(group_by_aliases).union(set(agg_on_aliases))
    initial_columns_in_group_agg = set(
        _get_initial_column_by_alias(initial_columns, alias)
        for alias in aliases_in_group_agg
    )
    return set(initial_columns).difference(initial_columns_in_group_agg)



def _get_group_by_aliases(group_agg_transform):
    return set()


def _get_agg_on_aliases(group_agg_transform):
    return set()


def _get_initial_column_by_alias(initial_columns, alias):
    for initial_column in initial_columns:
        if initial_column.alias == alias:
            return initial_column


def _should_group_by(
    oid_of_table_of_initial_column,
    oid_of_table_of_user_selected_group_by_col,
    oids_of_joinable_tables_with_single_results,
):
    """
    For the sake of efficiency, we're not checking here that user_selected_group_by_col is unique
    constrained: it is presumed that that is the case.
    """
    is_on_table_of_user_selected_column = oid_of_table_of_initial_column == oid_of_table_of_user_selected_group_by_col
    is_single_result = oid_of_table_of_initial_column in oids_of_joinable_tables_with_single_results
    should_group_by = is_on_table_of_user_selected_column or is_single_result
    return should_group_by


def _get_oid_of_table_of_initial_column(initial_column):
    return initial_column.reloid


from db.tables.operations.select import get_joinable_tables
def _get_oids_of_joinable_tables_with_single_results(db_query, engine, metadata):
    joinable_tables = get_joinable_tables(engine, metadata, db_query.base_table_oid)
    return set(
        _get_oid_of_joinable_table(joinable_table)
        for joinable_table
        in joinable_tables
        if _has_single_result(joinable_table)
    )


# TODO
def _is_unique_constrained(initial_column):
    return True


def _get_oid_of_joinable_table(joinable_table):
    joinable_table_oid = joinable_table[1]
    return joinable_table_oid


def _has_single_result(joinable_table):
    has_multiple_results = joinable_table[6]
    assert type(has_multiple_results) is bool
    return not has_multiple_results
