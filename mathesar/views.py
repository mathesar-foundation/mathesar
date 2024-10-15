from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from modernrpc.views import RPCEntryPoint

from mathesar.rpc.databases.configured import list_ as databases_list
from mathesar.rpc.explorations import list_ as explorations_list
from mathesar.rpc.schemas import list_ as schemas_list
from mathesar.rpc.servers.configured import list_ as get_servers_list
from mathesar.rpc.tables import list_with_metadata as tables_list
from mathesar.api.ui.serializers.users import UserSerializer
from mathesar import __version__


def get_schema_list(request, database_id):
    if database_id is not None:
        return schemas_list(request=request, database_id=database_id)
    else:
        return []


def get_database_list(request):
    return databases_list(request=request)


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
    user_serializer = UserSerializer(
        request.user,
        many=False,
        context={'request': request}
    )
    return user_serializer.data


def _get_internal_db_meta():
    internal_db = settings.DATABASES['default']
    if internal_db is not None:
        return {
            'type': 'postgres',
            'host': internal_db['HOST'],
            'port': internal_db['PORT'],
            'database_name': internal_db['NAME']
        }
    else:
        return {'type': 'sqlite'}


def _get_base_data_all_routes(request, database_id=None, schema_id=None):
    return {
        'current_database': int(database_id) if database_id else None,
        'current_schema': int(schema_id) if schema_id else None,
        'current_release_tag_name': __version__,
        'databases': get_database_list(request),
        'servers': get_servers_list(),
        'internal_db': _get_internal_db_meta(),
        'is_authenticated': not request.user.is_anonymous,
        'queries': [],
        'schemas': get_schema_list(request, database_id),
        'supported_languages': dict(getattr(settings, 'LANGUAGES', [])),
        'tables': [],
        'user': get_user_data(request)
    }


def get_common_data(request, database_id=None, schema_id=None):
    return {
        **_get_base_data_all_routes(request, database_id, schema_id),
        'tables': get_table_list(request, database_id, schema_id),
        'queries': get_queries_list(request, database_id, schema_id),
        'routing_context': 'normal',
    }


class MathesarRPCEntryPoint(LoginRequiredMixin, RPCEntryPoint):
    pass


@login_required
def home(request):
    database_list = get_database_list(request)
    number_of_databases = len(database_list)
    if number_of_databases > 1:
        return redirect('databases')
    elif number_of_databases == 1:
        db = database_list[0]
        return redirect('schemas', database_id=db['id'])
    else:
        return render(request, 'mathesar/index.html', {
            'common_data': get_common_data(request)
        })


@login_required
def databases(request):
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
def schemas(request, database_id, **kwargs):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database_id, None)
    })


@login_required
def schemas_home(request, database_id, schema_id, **kwargs):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database_id, schema_id)
    })


def page_not_found_view(request, exception):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request),
    }, status=404)
