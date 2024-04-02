from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect, get_object_or_404
from modernrpc.views import RPCEntryPoint
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from demo.utils import get_is_live_demo_mode, get_live_demo_db_name

from mathesar.api.db.permissions.database import DatabaseAccessPolicy
from mathesar.api.db.permissions.query import QueryAccessPolicy
from mathesar.api.db.permissions.schema import SchemaAccessPolicy
from mathesar.api.db.permissions.table import TableAccessPolicy
from mathesar.api.serializers.databases import ConnectionSerializer, TypeSerializer
from mathesar.api.serializers.schemas import SchemaSerializer
from mathesar.api.serializers.tables import TableSerializer
from mathesar.api.serializers.queries import QuerySerializer
from mathesar.api.ui.serializers.users import UserSerializer
from mathesar.api.utils import is_valid_uuid_v4
from mathesar.database.types import UIType
from mathesar.models.base import Database, Schema, Table
from mathesar.models.query import UIQuery
from mathesar.models.shares import SharedTable, SharedQuery
from mathesar.state import reset_reflection
from mathesar import __version__


def get_schema_list(request, database):
    qs = Schema.objects.filter(database=database)
    permission_restricted_qs = SchemaAccessPolicy.scope_queryset(request, qs)
    schema_serializer = SchemaSerializer(
        permission_restricted_qs,
        many=True,
        context={'request': request}
    )
    return schema_serializer.data


def _get_permissible_db_queryset(request):
    """
    Returns the queryset for connections a user is permitted to access.

    Note, connections that a user is permitted to access is the union of those
    permitted by DatabaseAccessPolicy and those containing Schemas permitted by
    SchemaAccessPolicy.

    Note, the live demo mode is an exception where the user is only permitted to
    access the database generated for him. We treat that as a subset of the
    connections the user can normally access, just in case someone finds a way
    to manipulate how we define whether we're in demo mode and which db is a
    user's demo db.
    """
    for deleted in (True, False):
        dbs_qs = Database.objects.filter(deleted=deleted)
        permitted_dbs_qs = DatabaseAccessPolicy.scope_queryset(request, dbs_qs)
        schemas_qs = Schema.objects.all()
        permitted_schemas_qs = SchemaAccessPolicy.scope_queryset(request, schemas_qs)
        dbs_containing_permitted_schemas_qs = Database.objects.filter(schemas__in=permitted_schemas_qs, deleted=deleted)
        permitted_dbs_qs = permitted_dbs_qs | dbs_containing_permitted_schemas_qs
        permitted_dbs_qs = permitted_dbs_qs.distinct()
        if get_is_live_demo_mode():
            live_demo_db_name = get_live_demo_db_name(request)
            if live_demo_db_name:
                permitted_dbs_qs = permitted_dbs_qs.filter(name=live_demo_db_name)
            else:
                raise Exception('This should never happen')
        if deleted:
            failed_permitted_dbs_qs = permitted_dbs_qs
        else:
            successful_permitted_dbs_qs = permitted_dbs_qs
    return successful_permitted_dbs_qs, failed_permitted_dbs_qs


def get_database_list(request):
    permission_restricted_db_qs, permission_restricted_failed_db_qs = _get_permissible_db_queryset(request)
    database_serializer = ConnectionSerializer(
        permission_restricted_db_qs,
        many=True,
        context={'request': request}
    )
    failed_db_data = []
    for db in permission_restricted_failed_db_qs:
        failed_db_data.append({
            'id': db.id,
            'username': db.username,
            'port': db.port,
            'host': db.host,
            'nickname': db.name,
            'database': db.db_name,
            'error': 'Error connecting to the database'
        })
    return database_serializer.data + failed_db_data


def get_table_list(request, schema):
    if schema is None:
        return []
    qs = Table.objects.filter(schema=schema)
    permission_restricted_qs = TableAccessPolicy.scope_queryset(request, qs)
    table_serializer = TableSerializer(
        permission_restricted_qs,
        many=True,
        context={'request': request}
    )
    return table_serializer.data


def get_queries_list(request, schema):
    if schema is None:
        return []
    qs = UIQuery.objects.filter(base_table__schema=schema)
    permission_restricted_qs = QueryAccessPolicy.scope_queryset(request, qs)

    query_serializer = QuerySerializer(
        permission_restricted_qs,
        many=True,
        context={'request': request}
    )
    return query_serializer.data


def get_ui_type_list(request, database):
    if database is None:
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


def get_base_data_all_routes(request, database=None, schema=None):
    return {
        'current_connection': database.id if database else None,
        'current_schema': schema.id if schema else None,
        'schemas': [],
        'connections': [],
        'tables': [],
        'queries': [],
        'abstract_types': get_ui_type_list(request, database),
        'user': get_user_data(request),
        'is_authenticated': not request.user.is_anonymous,
        'live_demo_mode': get_is_live_demo_mode(),
        'current_release_tag_name': __version__,
        'internal_db_connection': _get_internal_db_meta(),
    }


def _get_internal_db_meta():
    internal_db = Database.create_from_settings_key('default')
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


def get_common_data(request, database=None, schema=None):
    return {
        **get_base_data_all_routes(request, database, schema),
        'schemas': get_schema_list(request, database),
        'connections': get_database_list(request),
        'tables': get_table_list(request, schema),
        'queries': get_queries_list(request, schema),
        'supported_languages': dict(getattr(settings, 'LANGUAGES', [])),
        'routing_context': 'normal',
    }


def get_current_database(request, connection_id):
    """Get database from passed name, with fall back behavior."""
    successful_dbs, failed_dbs = _get_permissible_db_queryset(request)
    permitted_databases = successful_dbs | failed_dbs
    if connection_id is not None:
        current_database = get_object_or_404(permitted_databases, id=connection_id)
    else:
        request_database_name = get_live_demo_db_name(request)
        try:
            if request_database_name is not None:
                # Try to get the database named specified in the request
                current_database = permitted_databases.get(name=request_database_name)
            else:
                # Try to get the first database available
                current_database = permitted_databases.order_by('id').first()
        except Database.DoesNotExist:
            current_database = None
    return current_database


def get_current_schema(request, schema_id, database):
    # if there's a schema ID passed in, try to retrieve the schema, or return a 404 error.
    if schema_id is not None:
        permitted_schemas = SchemaAccessPolicy.scope_queryset(request, Schema.objects.all())
        return get_object_or_404(permitted_schemas, id=schema_id)
    else:
        try:
            # Try to get the first schema in the DB
            return Schema.objects.filter(database=database).order_by('id').first()
        except Schema.DoesNotExist:
            return None


def render_schema(request, database, schema):
    # if there's no schema available, redirect to the schemas page.
    if not schema:
        return redirect('schemas', db_name=database.name)
    else:
        # We are redirecting so that the correct URL is passed to the frontend.
        return redirect('schema_home', db_name=database.name, schema_id=schema.id)


def get_common_data_for_shared_entity(request, schema=None):
    database = schema.database if schema else None
    schemas = [schema] if schema else []
    databases = [database] if database else []
    serialized_schemas = SchemaSerializer(
        schemas,
        many=True,
        context={'request': request}
    ).data
    serialized_databases = ConnectionSerializer(
        databases,
        many=True,
        context={'request': request}
    ).data
    return {
        **get_base_data_all_routes(request, database, schema),
        'schemas': serialized_schemas,
        'connections': serialized_databases,
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
    connection_list = get_database_list(request)
    number_of_connections = len(connection_list)
    if number_of_connections > 1:
        return redirect('connections')
    elif number_of_connections == 1:
        db = connection_list[0]
        return redirect('schemas', connection_id=db['id'])
    else:
        return render(request, 'mathesar/index.html', {
            'common_data': get_common_data(request)
        })


@login_required
def connections(request):
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
def schema_home(request, connection_id, schema_id, **kwargs):
    database = get_current_database(request, connection_id)
    schema = get_current_schema(request, schema_id, database)
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database, schema)
    })


@login_required
def schemas(request, connection_id):
    database = get_current_database(request, connection_id)
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database, None)
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
