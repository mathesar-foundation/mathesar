from typing import TypedDict

from opentelemetry import metrics
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics.export import ConsoleMetricExporter
from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.models.base import Database
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


_meter = metrics.get_meter(__name__)
_readers = [PeriodicExportingMetricReader(OTLPMetricExporter(endpoint="http://host.docker.internal:4318/v1/metrics"), \
                                                                export_interval_millis=1000, \
                                                                export_timeout_millis=2000),
            PeriodicExportingMetricReader(ConsoleMetricExporter())
            ]
metrics.set_meter_provider(MeterProvider( metric_readers= _readers))
_number_of_api_calls_counter = _meter.create_counter("configureddatabases.count", \
                                                description="Number of count of configured databases", \
                                                unit="1")

class ConfiguredDatabaseInfo(TypedDict):
    """
    Information about a database.

    Attributes:
        id: the Django ID of the database model instance.
        name: The name of the database on the server.
        server_id: the Django ID of the server model instance for the database.
    """
    id: int
    name: str
    server_id: int

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            name=model.name,
            server_id=model.server.id
        )


@rpc_method(name="databases.configured.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, server_id: int = None, **kwargs) -> list[ConfiguredDatabaseInfo]:
    """
    List information about databases for a server. Exposed as `list`.

    If called with no `server_id`, all databases for all servers are listed.

    Args:
        server_id: The Django id of the server containing the databases.

    Returns:
        A list of database details.
    """
    user = kwargs.get(REQUEST_KEY).user
    if user.is_superuser:
        database_qs = Database.objects.filter(
            server__id=server_id
        ) if server_id is not None else Database.objects.all()
    else:
        database_qs = Database.objects.filter(
            server__id=server_id,
            userdatabaserolemap__user=user
        ) if server_id is not None else Database.objects.filter(
            userdatabaserolemap__user=user
        )
    _number_of_api_calls_counter.add(1, { "database": "db" })
    return [ConfiguredDatabaseInfo.from_model(db_model) for db_model in database_qs]


@rpc_method(name="databases.configured.disconnect")
@http_basic_auth_login_required
@handle_rpc_exceptions
def disconnect(*, database_id: int, **kwargs) -> None:
    """
    Disconnect a configured database.

    Args:
        database_id: The Django id of the database.
    """
    database_qs = Database.objects.get(id=database_id)
    database_qs.delete()
