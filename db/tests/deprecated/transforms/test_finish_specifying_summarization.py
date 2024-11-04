import pytest
from sqlalchemy import inspect
import types
import functools

from db.deprecated.queries.base import DBQuery, InitialColumn, JoinParameter
from db.deprecated.metadata import get_empty_metadata
from db.deprecated.transforms.base import Summarize, SelectSubsetOfColumns, Limit
from db.deprecated.columns import get_column_attnum_from_name
from db.deprecated.transforms.operations.finish_specifying import finish_specifying_summarize_transform


def generate_attribute_accessor(getattr):
    """
    Gives you an object instance whose `__getattr__` returns the result of calling the
    `getattr` parameter with the attribute name. This code uses a lot of string identifiers. This
    tool is intended to make that more ergonomic.

    Example use:

    generate_attribute_accessor(get_oid).academics  # returns the oid of 'academics'
    """
    def discard_self(_, attr_name):
        return getattr(attr_name)

    class tmp_class:
        __getattr__ = discard_self
    return tmp_class()


# Let's you generate an alias via `generate_attribute_accessor`.
#
# Example uses:
#
# ```
# gen_alias.universities.id  # returns "universities_id"
# gen_alias.universities_xyz.id_foobar  # returns "universities_xyz_id_foobar"
# ```
gen_alias = generate_attribute_accessor(
    lambda first_part: generate_attribute_accessor(
        lambda second_part: "_".join([first_part, second_part])
    )
)


# default output alias suffixes
group_output_alias_suffix = Summarize.default_group_output_alias_suffix
agg_output_alias_suffix = Summarize.default_agg_output_alias_suffix


def _gen_grouping_expr(alias):
    return dict(
        input_alias=alias,
        output_alias=alias + group_output_alias_suffix,
    )


def _gen_agg_expr(alias):
    return dict(
        input_alias=alias,
        output_alias=alias + agg_output_alias_suffix,
        function="distinct_aggregate_to_array",
    )


@pytest.fixture
def metadata():
    return get_empty_metadata()


@pytest.fixture
def academics_ids(engine_with_academics, metadata):
    """
    Makes it easier to get various references to the academics dataset.

    Main niceties are the nested access for attnums and aliases, and not having to use quoted
    strings.

    Example uses:

    ```
    ids = academics_ids

    # get attnum of the id column in the universities table
    ids.attnum.universities.id

    # get oid of the universities table
    ids.oid.universities
    ```
    """
    engine, schema = engine_with_academics

    @functools.cache
    def get_oid(table_name):
        return inspect(engine).get_table_oid(table_name, schema=schema)

    @functools.cache
    def get_attnum(table_name, column_name):
        table_oid = get_oid(table_name)
        return get_column_attnum_from_name(table_oid, column_name, engine, metadata=metadata)
    attnum_getter = generate_attribute_accessor(
        lambda table_name: generate_attribute_accessor(
            lambda column_name: get_attnum(table_name, column_name)
        )
    )
    oid_getter = generate_attribute_accessor(get_oid)
    return types.SimpleNamespace(
        attnum=attnum_getter,
        oid=oid_getter,
    )


@pytest.fixture
def initial_columns(academics_ids):
    ids = academics_ids
    return [
        # Serves as user-selected, unique-constrained column
        InitialColumn(
            reloid=ids.oid.academics,
            attnum=ids.attnum.academics.id,
            alias=gen_alias.academics.id,
        ),
        # Serves as initial column on same table as user-selected column
        InitialColumn(
            reloid=ids.oid.academics,
            attnum=ids.attnum.academics.name,
            alias=gen_alias.academics.name,
        ),
        # Serves as a "single result" initial column
        InitialColumn(
            reloid=ids.oid.universities,
            attnum=ids.attnum.universities.name,
            alias=gen_alias.universities.name,
            jp_path=[
                JoinParameter(
                    ids.oid.academics, ids.attnum.academics.institution,
                    ids.oid.universities, ids.attnum.universities.id,
                ),
            ],
        ),
        # Serves as a "multiple result" initial column
        InitialColumn(
            reloid=ids.oid.articles,
            attnum=ids.attnum.articles.title,
            alias=gen_alias.articles.title,
            jp_path=[
                JoinParameter(
                    ids.oid.academics, ids.attnum.academics.id,
                    ids.oid.articles, ids.attnum.articles.primary_author,
                ),
            ],
        ),
    ]


# a summarization transform that has the bare minimum partial specification.
empty_summarize = Summarize(
    dict(
        base_grouping_column=gen_alias.academics.id,
        grouping_expressions=[],
        aggregation_expressions=[]
    )
)


# a partial summarization transform whose base grouping column is in the grouping_expressions list
empty_summarize_base_col_in_grouping = Summarize(
    dict(
        base_grouping_column=gen_alias.academics.id,
        grouping_expressions=[
            _gen_grouping_expr(gen_alias.academics.id),
        ],
        aggregation_expressions=[]
    )
)


# the summarization transform that's the result of fully specifying `empty_summarize`.
full_summarize = Summarize(
    dict(
        base_grouping_column=gen_alias.academics.id,
        grouping_expressions=[
            _gen_grouping_expr(gen_alias.academics.id),
            _gen_grouping_expr(gen_alias.academics.name),
            _gen_grouping_expr(gen_alias.universities.name),
        ],
        aggregation_expressions=[
            _gen_agg_expr(gen_alias.articles.title),
        ]
    )
)


# the summarization transform that's the result of fully specifying `empty_summarize`,
# when we can't provide good defaults (i.e. we've put everything into aggregation).
full_summarize_no_defaults = Summarize(
    dict(
        base_grouping_column=gen_alias.academics.id,
        grouping_expressions=[
            _gen_grouping_expr(gen_alias.academics.id),
        ],
        aggregation_expressions=[
            _gen_agg_expr(gen_alias.academics.name),
            _gen_agg_expr(gen_alias.universities.name),
            _gen_agg_expr(gen_alias.articles.title),
        ]
    )
)


@pytest.mark.parametrize(
    'input_summarize_transform, expected_summarize_transform, transforms_before, transforms_after',
    [
        [
            empty_summarize_base_col_in_grouping,
            full_summarize,
            [],
            [],
        ],
        [
            empty_summarize,
            full_summarize,
            [],
            [],
        ],
        [
            empty_summarize,
            full_summarize,
            [
                # should not affect summarization
                Limit(10),
            ],
            [],
        ],
        [
            empty_summarize,
            full_summarize,
            [],
            [
                # should not affect summarization
                Limit(10),
            ],
        ],
        [
            empty_summarize,
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        _gen_grouping_expr(gen_alias.academics.id),
                        _gen_grouping_expr(gen_alias.academics.name),
                    ],
                    aggregation_expressions=[]
                )
            ),
            [
                # should prevent summarization from providing good defaults
                SelectSubsetOfColumns(
                    [
                        gen_alias.academics.id,
                        gen_alias.academics.name,
                    ]
                ),
            ],
            [],
        ],
        [
            # partial summarization
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        _gen_grouping_expr(gen_alias.academics.id),
                    ],
                    aggregation_expressions=[]
                )
            ),
            full_summarize,
            [],
            [],
        ],
        [
            # partial summarization
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        _gen_grouping_expr(gen_alias.academics.id),
                        _gen_grouping_expr(gen_alias.universities.name),
                    ],
                    aggregation_expressions=[]
                )
            ),
            # like full_summarize, but `gen_alias.academics.name` grouping expr is
            # after `gen_alias.universities.name`
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        _gen_grouping_expr(gen_alias.academics.id),
                        _gen_grouping_expr(gen_alias.universities.name),
                        _gen_grouping_expr(gen_alias.academics.name),
                    ],
                    aggregation_expressions=[
                        _gen_agg_expr(gen_alias.articles.title),
                    ]
                )
            ),
            [],
            [],
        ],
        [
            # partial summarization
            # like full_summarize, but `gen_alias.academics.name` grouping expr is
            # after `gen_alias.universities.name`
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id + group_output_alias_suffix,
                    grouping_expressions=[],
                    aggregation_expressions=[]
                )
            ),
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id + group_output_alias_suffix,
                    grouping_expressions=[
                        _gen_grouping_expr(gen_alias.academics.id + group_output_alias_suffix),
                        _gen_grouping_expr(gen_alias.academics.name + group_output_alias_suffix),
                    ],
                    aggregation_expressions=[
                        _gen_agg_expr(gen_alias.universities.name + agg_output_alias_suffix),
                        _gen_agg_expr(gen_alias.articles.title + agg_output_alias_suffix),
                    ]
                )
            ),
            [
                # a full summarization that groups on 2/3 of columns that would be grouped on by
                # default.
                Summarize(
                    dict(
                        base_grouping_column=gen_alias.academics.id,
                        grouping_expressions=[
                            _gen_grouping_expr(gen_alias.academics.id),
                            _gen_grouping_expr(gen_alias.academics.name),
                        ],
                        aggregation_expressions=[
                            _gen_agg_expr(gen_alias.universities.name),
                            _gen_agg_expr(gen_alias.articles.title),
                        ]
                    )
                ),
            ],
            [],
        ],
    ]
)
def test_some_transforms(
    engine_with_academics,
    metadata,
    academics_ids,
    initial_columns,
    input_summarize_transform,
    expected_summarize_transform,
    transforms_before,
    transforms_after,
):
    """
    Case where summarization is the sole transformation.
    """
    engine, _ = engine_with_academics
    ids = academics_ids

    transforms, ix_of_summarize_transform = _assemble_transforms(
        transforms_before,
        input_summarize_transform,
        transforms_after,
    )
    base_table_oid = ids.oid.academics
    db_query = DBQuery(
        base_table_oid=base_table_oid,
        initial_columns=initial_columns,
        engine=engine,
        transformations=transforms,
    )

    complete_summarize_transform = \
        finish_specifying_summarize_transform(db_query, ix_of_summarize_transform, engine, metadata)
    # We're comparing `__dict__`s, because then pytest can provide nice diffs.
    assert complete_summarize_transform.__dict__ == expected_summarize_transform.__dict__


def _assemble_transforms(transforms_before, transform, transforms_after):
    """
    When defining a test case we want to define what transforms come before the transform we're
    testing, what its index in the transform sequence is, and what transforms come after it.
    """
    transforms = [*transforms_before]
    transforms.append(transform)
    ix_of_transform = len(transforms) - 1
    transforms.extend(transforms_after)
    return transforms, ix_of_transform
