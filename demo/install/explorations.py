"""This module contains logic for creating premade explorations of demo data."""
from demo.install.base import (
    LIBRARY_MANAGEMENT,
    get_dj_column_by_name, get_dj_schema_by_name, get_dj_table_by_name,
)
from mathesar.models.query import UIQuery


def load_custom_explorations(engine):
    """Create some premade explorations to look at demo data."""
    _create_checkout_monthly_report(engine)


def _create_checkout_monthly_report(engine):
    schema = get_dj_schema_by_name(engine, LIBRARY_MANAGEMENT)
    print(schema)
    checkouts = get_dj_table_by_name(schema, "Checkouts")
    print(checkouts)
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
