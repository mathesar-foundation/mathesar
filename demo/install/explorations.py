"""This module contains logic for creating premade explorations of demo data."""
from demo.install.base import (
    LIBRARY_MANAGEMENT, MATHESAR_CON, ARXIV,
    get_dj_column_by_name, get_dj_schema_by_name, get_dj_table_by_name,
)
from mathesar.models.query import UIQuery


def load_custom_explorations(engine):
    """Create some premade explorations to look at demo data."""
    _create_checkout_monthly_report(engine)
    _create_overdue_books_report(engine)
    _create_topics_by_organization_view(engine)
    _create_organizations_by_topic_view(engine)
    _create_paper_authors_view(engine)


def _create_checkout_monthly_report(engine):
    schema = get_dj_schema_by_name(engine, LIBRARY_MANAGEMENT)
    checkouts = get_dj_table_by_name(schema, "Checkouts")
    initial_columns = [
        {
            "id": get_dj_column_by_name(checkouts, "id").id,
            "alias": "Checkouts_id",
        },
        {
            "id": get_dj_column_by_name(checkouts, "Checkout Time").id,
            "alias": "Checkouts_Checkout Time",
        },
    ]
    transformations = [
        {
            "spec": {
                "base_grouping_column": "Checkouts_Checkout Time",
                "grouping_expressions": [
                    {
                        "preproc": "truncate_to_month",
                        "input_alias": "Checkouts_Checkout Time",
                        "output_alias": "Checkouts_Checkout Time_grouped"
                    }
                ],
                "aggregation_expressions": [
                    {
                        "function": "count",
                        "input_alias": "Checkouts_id",
                        "output_alias": "Checkouts_id_agged"
                    }
                ]
            },
            "type": "summarize"
        }
    ]
    display_names = {
        "Checkouts_id": "Checkouts_id",
        "Checkouts_id_agged": "Number of Checkouts",
        "Checkouts_Checkout Time": "Checkouts_Checkout Time",
        "Checkouts_Checkout Time_grouped": "Month"
    }

    UIQuery.objects.create(
        name="Monthly Checkouts",
        description="This report gives the number of checkouts each month.",
        base_table=checkouts,
        initial_columns=initial_columns,
        transformations=transformations,
        display_names=display_names,
    )


def _create_overdue_books_report(engine):
    schema = get_dj_schema_by_name(engine, LIBRARY_MANAGEMENT)
    books = get_dj_table_by_name(schema, "Books")
    checkouts = get_dj_table_by_name(schema, "Checkouts")
    items = get_dj_table_by_name(schema, "Items")
    patrons = get_dj_table_by_name(schema, "Patrons")
    initial_columns = [
        {
            "id": get_dj_column_by_name(patrons, "Email").id,
            "alias": "Patrons_Email",
            "jp_path": [
                [
                    get_dj_column_by_name(checkouts, "Patron").id,
                    get_dj_column_by_name(patrons, "id").id
                ],
            ]
        }, {
            "id": get_dj_column_by_name(books, "Title").id,
            "alias": "Books_Title",
            "jp_path": [
                [
                    get_dj_column_by_name(checkouts, "Item").id,
                    get_dj_column_by_name(items, "id").id,
                ], [
                    get_dj_column_by_name(items, "Book").id,
                    get_dj_column_by_name(books, "id").id,
                ]
            ]
        }, {
            "id": get_dj_column_by_name(checkouts, "Due Date").id,
            "alias": "Checkouts_Due Date"
        }, {
            "id": get_dj_column_by_name(checkouts, "Check In Time").id,
            "alias": "Checkouts_Check In Time"
        }, {
            "id": get_dj_column_by_name(checkouts, "id").id,
            "alias": "Checkouts_id"
        },
    ]
    transformations = [
        {
            "spec": {
                "lesser": [
                    {"column_name": ["Checkouts_Due Date"]},
                    {"literal": ["2023-01-20"]}
                ]
            },
            "type": "filter"
        }, {
            "spec": {
                "null": [
                    {"column_name": ["Checkouts_Check In Time"]}
                ]
            },
            "type": "filter"
        }, {
            "spec": [
                "Checkouts_Due Date", "Checkouts_Check In Time", "Checkouts_id"
            ],
            "type": "hide"
        }, {
            "spec": {
                "base_grouping_column": "Patrons_Email",
                "grouping_expressions": [
                    {
                        "input_alias": "Patrons_Email",
                        "output_alias": "Patrons_Email_grouped"
                    }
                ],
                "aggregation_expressions": [
                    {
                        "function": "distinct_aggregate_to_array",
                        "input_alias": "Books_Title",
                        "output_alias": "Books_Title_agged"
                    }
                ]
            },
            "type": "summarize"
        }
    ]
    display_names = {
        "Books_Title": "Books_Title",
        "Checkouts_id": "Checkouts_id",
        "Patrons_Email": "Patrons_Email",
        "Checkouts_Due Date": "Checkouts_Due Date",
        "Checkouts_Check In Time": "Checkouts_Check In Time",
        "Patrons_Email_grouped": "Patron Email",
        "Books_Title_agged": "Overdue Books",
    }
    description = "This shows each patron's overdue books if they have any."

    UIQuery.objects.create(
        name="Overdue Book Report",
        description=description,
        base_table=checkouts,
        initial_columns=initial_columns,
        transformations=transformations,
        display_names=display_names,
    )


def _create_topics_by_organization_view(engine):
    schema = get_dj_schema_by_name(engine, MATHESAR_CON)

    organizations = get_dj_table_by_name(schema, "Organizations")
    speakers = get_dj_table_by_name(schema, "Speakers")
    talks = get_dj_table_by_name(schema, "Talks")
    topics = get_dj_table_by_name(schema, "Topics")
    tt_map = get_dj_table_by_name(schema, "Talk Topic Map")

    initial_columns = [
        {
            "id": get_dj_column_by_name(talks, "id").id,
            "alias": "Talks_id"
        }, {
            "id": get_dj_column_by_name(topics, "Name").id,
            "alias": "Topics_Name",
            "jp_path": [
                [
                    get_dj_column_by_name(talks, "id").id,
                    get_dj_column_by_name(tt_map, "Talk").id,
                ], [
                    get_dj_column_by_name(tt_map, "Topic").id,
                    get_dj_column_by_name(topics, "id").id,
                ]
            ]
        }, {
            "id": get_dj_column_by_name(organizations, "Organization").id,
            "alias": "Organizations_Organization",
            "jp_path": [
                [
                    get_dj_column_by_name(talks, "Speaker").id,
                    get_dj_column_by_name(speakers, "id").id,
                ], [
                    get_dj_column_by_name(speakers, "Organization").id,
                    get_dj_column_by_name(organizations, "id").id,
                ]
            ]
        }
    ]
    transformations = [
        {
            "spec": ["Talks_id"],
            "type": "hide"
        }, {
            "spec": {
                "base_grouping_column": "Organizations_Organization",
                "grouping_expressions": [
                    {
                        "input_alias": "Organizations_Organization",
                        "output_alias": "Organizations_Organization_grouped"
                    }
                ],
                "aggregation_expressions": [
                    {
                        "function": "distinct_aggregate_to_array",
                        "input_alias": "Topics_Name",
                        "output_alias": "Topics_Name_agged"
                    }
                ]
            },
            "type": "summarize"
        }
    ]
    display_names = {
        "Talks_id": "Talks_id",
        "Topics_Name": "Topics_Name",
        "Topics_Name_agged": "Topics",
        "Organizations_Organization": "Organizations_Organization",
        "Organizations_Organization_grouped": "Organization"
    }
    description = "This gives a list of topics each organization is giving a talk about."

    UIQuery.objects.create(
        name="Topics by Organization",
        description=description,
        base_table=talks,
        initial_columns=initial_columns,
        transformations=transformations,
        display_names=display_names,
    )


def _create_organizations_by_topic_view(engine):
    schema = get_dj_schema_by_name(engine, MATHESAR_CON)

    organizations = get_dj_table_by_name(schema, "Organizations")
    speakers = get_dj_table_by_name(schema, "Speakers")
    talks = get_dj_table_by_name(schema, "Talks")
    topics = get_dj_table_by_name(schema, "Topics")
    tt_map = get_dj_table_by_name(schema, "Talk Topic Map")

    initial_columns = [
        {
            "id": get_dj_column_by_name(talks, "id").id,
            "alias": "Talks_id"
        }, {
            "id": get_dj_column_by_name(topics, "Name").id,
            "alias": "Topics_Name",
            "jp_path": [
                [
                    get_dj_column_by_name(talks, "id").id,
                    get_dj_column_by_name(tt_map, "Talk").id,
                ], [
                    get_dj_column_by_name(tt_map, "Topic").id,
                    get_dj_column_by_name(topics, "id").id,
                ]
            ]
        }, {
            "id": get_dj_column_by_name(organizations, "Organization").id,
            "alias": "Organizations_Organization",
            "jp_path": [
                [
                    get_dj_column_by_name(talks, "Speaker").id,
                    get_dj_column_by_name(speakers, "id").id,
                ], [
                    get_dj_column_by_name(speakers, "Organization").id,
                    get_dj_column_by_name(organizations, "id").id,
                ]
            ]
        }
    ]
    transformations = [
        {
            "spec": ["Talks_id"],
            "type": "hide"
        }, {
            "spec": {
                "base_grouping_column": "Topics_Name",
                "grouping_expressions": [
                    {
                        "input_alias": "Topics_Name",
                        "output_alias": "Topics_Name_grouped"
                    }
                ],
                "aggregation_expressions": [
                    {
                        "function": "distinct_aggregate_to_array",
                        "input_alias": "Organizations_Organization",
                        "output_alias": "Organizations_Organization_agged"
                    }
                ]
            },
            "type": "summarize"
        }
    ]
    display_names = {
        "Talks_id": "Talks_id",
        "Topics_Name": "Topics_Name",
        "Topics_Name_grouped": "Topic",
        "Organizations_Organization": "Organizations_Organization",
        "Organizations_Organization_agged": "Organizations"
    }
    description = "This gives a list of organizations giving talks about each topic."

    UIQuery.objects.create(
        name="Organizations by Topic",
        description=description,
        base_table=talks,
        initial_columns=initial_columns,
        transformations=transformations,
        display_names=display_names,
    )


def _create_paper_authors_view(engine):
    schema = get_dj_schema_by_name(engine, ARXIV)

    papers = get_dj_table_by_name(schema, "Papers")
    pa_map = get_dj_table_by_name(schema, "Paper-Author Map")
    authors = get_dj_table_by_name(schema, "Authors")
    initial_columns = [
        {
            "id": get_dj_column_by_name(papers, "id").id,
            "alias": "Papers_id"
        }, {
            "id": get_dj_column_by_name(papers, "Title").id,
            "alias": "Papers_Title"
        }, {
            "id": get_dj_column_by_name(authors, "Name").id,
            "alias": "Authors_Name",
            "jp_path": [
                [
                    get_dj_column_by_name(papers, "id").id,
                    get_dj_column_by_name(pa_map, "paper_id").id,
                ], [
                    get_dj_column_by_name(pa_map, "author_id").id,
                    get_dj_column_by_name(authors, "id").id,
                ]
            ]
        }
    ]
    transformations = [
        {
            "spec": {
                "base_grouping_column": "Papers_id",
                "grouping_expressions": [
                    {
                        "input_alias": "Papers_id",
                        "output_alias": "Papers_id_grouped"
                    }, {
                        "input_alias": "Papers_Title",
                        "output_alias": "Papers_Title_grouped"
                    }
                ],
                "aggregation_expressions": [
                    {
                        "function": "distinct_aggregate_to_array",
                        "input_alias": "Authors_Name",
                        "output_alias": "Authors_Name_agged"
                    }
                ]
            },
            "type": "summarize"
        }
    ]
    display_names = {
        "Papers_id": "Papers_id",
        "Authors_Name": "Authors_Name",
        "Papers_Title": "Papers_Title",
        "Papers_id_grouped": "Paper id",
        "Authors_Name_agged": "Authors",
        "Papers_Title_grouped": "Paper Title"
    }
    description = "This report gives the title of each paper, along with a list of its authors."

    UIQuery.objects.create(
        name="Paper Authors",
        description=description,
        base_table=papers,
        initial_columns=initial_columns,
        transformations=transformations,
        display_names=display_names,
    )
