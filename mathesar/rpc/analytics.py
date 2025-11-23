"""
RPC-exposed classes and functions for managing Mathesar analytics.

This module provides RPC endpoints for checking analytics status,
initializing analytics, disabling analytics, viewing generated reports,
and uploading user feedback. These functions are consumed by the UI
via the RPC API.
"""

from typing import TypedDict, Optional
from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.analytics import (
    is_analytics_enabled,
    initialize_analytics,
    disable_analytics,
    prepare_analytics_report,
    upload_feedback_message,
)


class AnalyticsReport(TypedDict):
    """
    A structured report containing usage statistics collected by Mathesar.

    Attributes:
        installation_id (Optional[str]): A unique identifier for this
            Mathesar installation. ``None`` indicates analytics has not
            been initialized.
        mathesar_version (str): The current version of Mathesar.
        user_count (int): Total number of configured users.
        active_user_count (int): Number of users who recently logged in.
        configured_role_count (int): Number of configured database roles.
        connected_database_count (int): Number of connected databases.
        connected_database_schema_count (int): Total schemas across all
            connected databases.
        connected_database_table_count (int): Total tables across all
            connected databases.
        connected_database_record_count (int): Approximate count of all
            records across connected databases.
        exploration_count (int): Number of explorations created.
        form_count (int): Number of forms created.
        public_form_count (int): Number of forms published publicly.
    """

    installation_id: Optional[str]
    mathesar_version: str
    user_count: int
    active_user_count: int
    configured_role_count: int
    connected_database_count: int
    connected_database_schema_count: int
    connected_database_table_count: int
    connected_database_record_count: int
    exploration_count: int
    form_count: int
    public_form_count: int

    @classmethod
    def from_dict(cls, d):
        """
        Convert a raw dictionary from the analytics module into an
        ``AnalyticsReport`` TypedDict.

        Args:
            d (dict): Raw input dictionary produced by analytics reporting.

        Returns:
            AnalyticsReport: A normalized, strongly-typed analytics report.
        """
        if d["installation_id"] is not None:
            d["installation_id"] = str(d["installation_id"].value)
        return cls(d)


class AnalyticsState(TypedDict):
    """
    Represents the current analytics state.

    Attributes:
        enabled (bool): True if analytics collection is enabled, False otherwise.
    """

    enabled: bool

    @classmethod
    def from_boolean(cls, b):
        """
        Construct an ``AnalyticsState`` from a boolean value.

        Args:
            b (bool): Whether analytics is enabled.

        Returns:
            AnalyticsState: Wrapped state representing analytics state.
        """
        return cls({"enabled": b})


@mathesar_rpc_method(name="analytics.get_state")
def get_state() -> AnalyticsState:
    """
    Retrieve the current analytics enablement state.

    Returns:
        AnalyticsState: A structure indicating whether analytics is enabled.
    """
    return AnalyticsState.from_boolean(is_analytics_enabled())


@mathesar_rpc_method(name="analytics.initialize")
def initialize() -> None:
    """
    Initialize analytics collection for this Mathesar installation.

    Once initialized, analytics are gathered daily and can be uploaded
    based on configured reporting settings. Initialization creates a
    persistent installation ID for tracking analytics.
    """
    initialize_analytics()


@mathesar_rpc_method(name="analytics.disable")
def disable() -> None:
    """
    Disable analytics collection for this Mathesar installation.

    This operation removes the stored installation ID and clears all
    previously generated analytics reports. Analytics collection remains
    disabled until explicitly reinitialized.
    """
    disable_analytics()


@mathesar_rpc_method(name="analytics.view_report")
def view_report() -> AnalyticsReport:
    """
    Generate and return an example analytics report.

    This uses the same reporting logic used for real analytics uploads but
    does not store or transmit any data.

    Returns:
        AnalyticsReport: A complete analytics report object containing usage
        metrics and installation information.
    """
    report = prepare_analytics_report()
    return AnalyticsReport.from_dict(report)


@mathesar_rpc_method(name="analytics.upload_feedback", auth="login")
def upload_feedback(message: str) -> None:
    """
    Upload a user feedback message to Mathesar's servers.

    Args:
        message (str): The user-provided feedback message.
    """
    upload_feedback_message(message)
