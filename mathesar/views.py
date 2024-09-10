from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from modernrpc.views import RPCEntryPoint
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from mathesar.rpc.databases.configured import list_ as databases_list
from mathesar.rpc.schemas import list_ as schemas_list
from mathesar.rpc.servers.configured import list_ as get_servers_list
from mathesar.api.serializers.databases import TypeSerializer
from mathesar.api.serializers.tables import TableSerializer
from mathesar.api.serializers.queries import QuerySerializer
from mathesar.api.ui.serializers.users import UserSerializer
from mathesar.api.utils import is_valid_uuid_v4
from mathesar.database.types import UIType
from mathesar.models.deprecated import Connection
from mathesar.models.shares import SharedTable, SharedQuery
from mathesar.state import reset_reflection
from mathesar import __version__


def get_schema_list(request, database_id):
    if database_id is not None:
        return schemas_list(request=request, database_id=database_id)
    else:
        return []


def get_database_list(request):
    return databases_list(request=request)


def get_table_list(request, schema_id):
    # TODO: Fill this method
    return []


def get_queries_list(request, schema_id):
    # TODO: Fill this method
    return []


def get_ui_type_list(request, database_id):
    if database_id is None:
        return []
    type_serializer = TypeSerializer(
        UIType,
        many=True,
        context={'request': request}
    )
    return type_serializer.data


def get_user_data(request):
    user_serializer = UserSerializer(
        request.user,
        many=False,
        context={'request': request}
    )
    return user_serializer.data


def _get_internal_db_meta():
    internal_db = Connection.create_from_settings_key('default')
    if internal_db is not None:
        return {
            'type': 'postgres',
            'user': internal_db.username,
            'host': internal_db.host,
            'port': internal_db.port,
            'database': internal_db.db_name
        }
    else:
        return {'type': 'sqlite'}


def _get_base_data_all_routes(request, database_id=None, schema_id=None):
    return {
        'abstract_types': get_ui_type_list(request, database_id),
        'current_database': int(database_id) if database_id else None,
        'current_schema': int(schema_id) if schema_id else None,
        'current_release_tag_name': __version__,
        'databases': get_database_list(request),
        'servers': get_servers_list(),
        'internal_db_connection': _get_internal_db_meta(),
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
        'tables': get_table_list(request, schema_id),
        'queries': get_queries_list(request, schema_id),
        'routing_context': 'normal',
    }


def get_common_data_for_shared_entity(request, schema=None):
    # TODO: Provide only authorized schemas & databases
    # database = schema.database if schema else None
    # schemas = [schema] if schema else []
    # databases = [database] if database else []
    return {
        # **_get_base_data_all_routes(request, database, schema),
        # 'schemas': serialized_schemas,
        # 'databases': serialized_databases,
        **_get_base_data_all_routes(request),
        'routing_context': 'anonymous',
    }


def get_common_data_for_shared_table(request, table):
    tables = [table] if table else []
    serialized_tables = TableSerializer(
        tables,
        many=True,
        context={'request': request}
    ).data
    schema = table.schema if table else None
    return {
        **get_common_data_for_shared_entity(request, schema),
        'tables': serialized_tables,
    }


def get_common_data_for_shared_query(request, query):
    queries = [query] if query else []
    serialized_queries = QuerySerializer(
        queries,
        many=True,
        context={'request': request}
    ).data
    schema = query.base_table.schema if query else None
    return {
        **get_common_data_for_shared_entity(request, schema),
        'queries': serialized_queries,
    }


class MathesarRPCEntryPoint(LoginRequiredMixin, RPCEntryPoint):
    pass


@login_required
@api_view(['POST'])
def reflect_all(_):
    reset_reflection()
    return Response(status=status.HTTP_200_OK)


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


def shared_table(request, slug):
    shared_table_link = SharedTable.get_by_slug(slug) if is_valid_uuid_v4(slug) else None
    table = shared_table_link.table if shared_table_link else None

    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data_for_shared_table(request, table),
        'route_specific_data': {
            'shared_table': {'table_id': table.id if table else None}
        }
    })


def shared_query(request, slug):
    shared_query_link = SharedQuery.get_by_slug(slug) if is_valid_uuid_v4(slug) else None
    query = shared_query_link.query if shared_query_link else None

    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data_for_shared_query(request, query),
        'route_specific_data': {
            'shared_query': {'query_id': query.id if query else None}
        }
    })


def page_not_found_view(request, exception):
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request),
    }, status=404)
