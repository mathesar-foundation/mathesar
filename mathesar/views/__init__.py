from functools import wraps

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from modernrpc.exceptions import RPCException
from modernrpc.views import RPCEntryPoint

from config.database_config import get_internal_database_config
from mathesar.rpc.databases.configured import list_ as databases_list
from mathesar.rpc.explorations import list_ as explorations_list
from mathesar.rpc.schemas import list_ as schemas_list
from mathesar.rpc.servers.configured import list_ as get_servers_list
from mathesar.rpc.tables import list_with_metadata as tables_list
from mathesar.rpc.users import get as get_user_info
from mathesar import __version__

from . import export, users


__all__ = [export, users]


def get_database_list(request):
    return databases_list(request=request)


def wrap_data_and_rpc_exceptions(f):
    @wraps(f)
    def safe_func(*args, **kwargs):
        try:
            return {
                'state': 'success',
                'data': f(*args, **kwargs)
            }
        except RPCException as exp:
            return {
                'state': 'failure',
                'error': {
                    'code': exp.code,
                    'message': exp.message
                }
            }
    return safe_func


@wrap_data_and_rpc_exceptions
def get_schema_list(request, database_id):
    if database_id is not None:
        return schemas_list(request=request, database_id=database_id)
    else:
        return []


@wrap_data_and_rpc_exceptions
def get_table_list(request, database_id, schema_oid):
    if database_id is not None and schema_oid is not None:
        return tables_list(
            request=request,
            database_id=database_id,
            schema_oid=schema_oid
        )
    else:
        return []


def get_queries_list(request, database_id, schema_oid):
    if database_id is not None and schema_oid is not None:
        return explorations_list(
            request=request,
            database_id=database_id,
            schema_oid=schema_oid
        )
    else:
        return []


def get_user_data(request):
    return get_user_info(user_id=request.user.id)


def _get_internal_db_meta():
    internal_db = get_internal_database_config()
    if internal_db is not None:
        return {
            'type': 'postgres',
            'host': internal_db.host,
            'port': internal_db.port,
            'database_name': internal_db.dbname,
        }


def get_common_data(request, database_id=None, schema_oid=None):
    databases = get_database_list(request)
    database_id_int = int(database_id) if database_id else None
    current_database = next((database for database in databases if database['id'] == database_id_int), None)
    current_database_id = current_database['id'] if current_database else None

    schemas = get_schema_list(request, current_database_id)
    schema_oid_int = int(schema_oid) if schema_oid else None
    schemas_data = schemas['data'] if 'data' in schemas else []
    current_schema = next((schema for schema in schemas_data if schema['oid'] == schema_oid_int), None)
    current_schema_oid = current_schema['oid'] if current_schema else None

    return {
        'current_database': current_database_id,
        'current_schema': current_schema_oid,
        'current_release_tag_name': __version__,
        'databases': databases,
        'internal_db': _get_internal_db_meta(),
        'is_authenticated': not request.user.is_anonymous,
        'servers': get_servers_list(),
        'schemas': schemas,
        'supported_languages': dict(getattr(settings, 'LANGUAGES', [])),
        'tables': get_table_list(request, current_database_id, current_schema_oid),
        'user': get_user_data(request),
        'queries': get_queries_list(request, current_database_id, current_schema_oid),
        'routing_context': 'normal',
    }


class MathesarRPCEntryPoint(RPCEntryPoint):
    pass


@login_required
def home(request):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request)
    })


@login_required
def profile(request):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request)
    })


@login_required
def admin_home(request, **kwargs):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request)
    })


@login_required
def database_route(request, database_id, **kwargs):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database_id, None)
    })


@login_required
def schema_route(request, database_id, schema_id, **kwargs):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database_id, schema_id)
    })


def analytics_sample_report(request):
    return render(request, 'analytics/sample_report.html')


def page_not_found_view(request, exception):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request),
    }, status=404)
