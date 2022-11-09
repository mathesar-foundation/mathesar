import pytest
import types
import functools

from db.tables.operations.select import get_oid_from_table
from db.queries.base import DBQuery, InitialColumn
from db.metadata import get_empty_metadata
from db.transforms.base import Summarize
from db.columns.operations.select import get_column_attnum_from_name
from db.transforms.operations.finish_specifying import finish_specifying_summarize_transform

def generate_attribute_accessor(getattr):
    """
    Gives you an object instance whose `__getattr__` returns the result of calling the
    `getattr` parameter with the attribute name. This code uses a lot of string identifiers. This
    tool is intended to make that more ergonomic.

    Example use:

    generate_attribute_accessor(get_oid).academics  # returns the oid of 'academics'
    """
    class tmp_class:
        __getattr__ = lambda _, attr_name: getattr(attr_name)
    return tmp_class()


# Generates an alias via `generate_attribute_accessor`.
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
        return get_oid_from_table(table_name, schema, engine)
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
                [
                    (ids.oid.academics, ids.attnum.academics.institution),
                    (ids.oid.universities, ids.attnum.universities.id),
                ],
            ],
        ),
        # Serves as a "multiple result" initial column
        InitialColumn(
            reloid=ids.oid.articles,
            attnum=ids.attnum.articles.title,
            alias=gen_alias.articles.title,
            jp_path=[
                [
                    (ids.oid.academics, ids.attnum.academics.id),
                    (ids.oid.articles, ids.attnum.articles.primary_author),
                ],
            ],
        ),
    ]

@pytest.mark.parametrize(
    'input_summarize_transform, expected_summarize_transform',
    [
        [
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[],
                    aggregation_expressions=[]
                )
            ),
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        dict(
                            input_alias=gen_alias.academics.id,
                            output_alias=gen_alias.academics.id + group_output_alias_suffix,
                        ),
                        dict(
                            input_alias=gen_alias.academics.name,
                            output_alias=gen_alias.academics.name + group_output_alias_suffix,
                        ),
                        dict(
                            input_alias=gen_alias.universities.name,
                            output_alias=gen_alias.universities.name + group_output_alias_suffix,
                        ),
                    ],
                    aggregation_expressions=[
                        dict(
                            input_alias=gen_alias.articles.title,
                            output_alias=gen_alias.articles.title + agg_output_alias_suffix,
                            function="aggregate_to_array",
                        ),
                    ]
                )
            ),
        ],
        [
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        dict(
                            input_alias=gen_alias.academics.id,
                            output_alias=gen_alias.academics.id + group_output_alias_suffix,
                        ),
                    ],
                    aggregation_expressions=[]
                )
            ),
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        dict(
                            input_alias=gen_alias.academics.id,
                            output_alias=gen_alias.academics.id + group_output_alias_suffix,
                        ),
                        dict(
                            input_alias=gen_alias.academics.name,
                            output_alias=gen_alias.academics.name + group_output_alias_suffix,
                        ),
                        dict(
                            input_alias=gen_alias.universities.name,
                            output_alias=gen_alias.universities.name + group_output_alias_suffix,
                        ),
                    ],
                    aggregation_expressions=[
                        dict(
                            input_alias=gen_alias.articles.title,
                            output_alias=gen_alias.articles.title + agg_output_alias_suffix,
                            function="aggregate_to_array",
                        ),
                    ]
                )
            ),
        ],
        [
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        dict(
                            input_alias=gen_alias.academics.id,
                            output_alias=gen_alias.academics.id + group_output_alias_suffix,
                        ),
                        dict(
                            input_alias=gen_alias.universities.name,
                            output_alias=gen_alias.universities.name + group_output_alias_suffix,
                        ),
                    ],
                    aggregation_expressions=[]
                )
            ),
            Summarize(
                dict(
                    base_grouping_column=gen_alias.academics.id,
                    grouping_expressions=[
                        dict(
                            input_alias=gen_alias.academics.id,
                            output_alias=gen_alias.academics.id + group_output_alias_suffix,
                        ),
                        dict(
                            input_alias=gen_alias.universities.name,
                            output_alias=gen_alias.universities.name + group_output_alias_suffix,
                        ),
                        dict(
                            input_alias=gen_alias.academics.name,
                            output_alias=gen_alias.academics.name + group_output_alias_suffix,
                        ),
                    ],
                    aggregation_expressions=[
                        dict(
                            input_alias=gen_alias.articles.title,
                            output_alias=gen_alias.articles.title + agg_output_alias_suffix,
                            function="aggregate_to_array",
                        ),
                    ]
                )
            ),
        ],
    ]
)
def test_only_transform(
    engine_with_academics,
        metadata,
        academics_ids,
        initial_columns,
        input_summarize_transform,
        expected_summarize_transform,
):
    """
    Case where summarization is the only transformation.
    """
    engine, _ = engine_with_academics
    ids = academics_ids

    transforms = [input_summarize_transform]
    ix_of_summarize_transform = 0
    base_table_oid = ids.oid.academics
    db_query = DBQuery(
        base_table_oid=base_table_oid,
        initial_columns=initial_columns,
        engine=engine,
        transformations=transforms,
    )

    complete_summarize_transform = \
        finish_specifying_summarize_transform(db_query, ix_of_summarize_transform, engine, metadata)
    assert complete_summarize_transform == expected_summarize_transform
