"""
Classes and functions exposed to the RPC endpoint for managing analytics.
"""
from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.analytics import (
    initialize_analytics,
    disable_analytics,
    prepare_analytics_report,
)


@mathesar_rpc_method(name="analytics.initialize")
def initialize():
    """
    Initialize analytics collection and reporting in Mathesar

    If initialized, analytics are gathered to a local model once per day,
    and uploaded.
    """
    initialize_analytics()


@mathesar_rpc_method(name="analytics.disable")
def disable():
    """
    Disable analytics collection and reporting in Mathesar

    Disabling analytics amounts to (for now) simply deleting the
    Installation ID, ensuring that it's impossible to save analytics
    reports. Any reports currently saved are removed when the
    Installation ID is deleted.
    """
    disable_analytics()


@mathesar_rpc_method(name="analytics.view_report")
def view_report():
    """
    View an example analytics report, prepared with the same function
    that creates real reports that would be saved and uploaded.
    """
    report = prepare_analytics_report()
    if report["installation_id"] is not None:
        report["installation_id"] = str(report["installation_id"].value)

    return report
