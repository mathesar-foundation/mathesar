from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required

from mathesar.models.base import Database, Schema, Table
from mathesar.api.serializers.databases import DatabaseSerializer, TypeSerializer
from mathesar.api.serializers.schemas import SchemaSerializer
from mathesar.api.serializers.tables import TableSerializer
from mathesar.api.serializers.queries import QuerySerializer
from mathesar.database.types import UIType
from mathesar.models.query import UIQuery


def get_schema_list(request, database):
    schema_serializer = SchemaSerializer(
        Schema.objects.filter(database=database),
        many=True,
        context={'request': request}
    )
    return schema_serializer.data


def get_database_list(request):
    database_serializer = DatabaseSerializer(
        Database.objects.all(),
        many=True,
        context={'request': request}
    )
    return database_serializer.data


def get_table_list(request, schema):
    if schema is None:
        return []
    table_serializer = TableSerializer(
        Table.objects.filter(schema=schema),
        many=True,
        context={'request': request}
    )
    return table_serializer.data


def get_queries_list(request, schema):
    if schema is None:
        return []
    query_serializer = QuerySerializer(
        UIQuery.objects.filter(base_table__schema=schema),
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


def get_common_data(request, database, schema=None):
    return {
        'current_db': database.name if database else None,
        'current_schema': schema.id if schema else None,
        'schemas': get_schema_list(request, database),
        'databases': get_database_list(request),
        'tables': get_table_list(request, schema),
        'queries': get_queries_list(request, schema),
        'abstract_types': get_ui_type_list(request, database)
    }


def get_current_database(request, db_name):
    # if there's a DB name passed in, try to retrieve the database, or return a 404 error.
    if db_name is not None:
        return get_object_or_404(Database, name=db_name)
    else:
        try:
            # Try to get the first database available
            return Database.objects.order_by('id').first()
        except Database.DoesNotExist:
            return None


def get_current_schema(request, schema_id, database):
    # if there's a schema ID passed in, try to retrieve the schema, or return a 404 error.
    if schema_id is not None:
        return get_object_or_404(Schema, id=schema_id)
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


@login_required
def home(request):
    database = get_current_database(request, None)
    return redirect('schemas', db_name=database.name)


@login_required
def schema_home(request, db_name, schema_id, **kwargs):
    database = get_current_database(request, db_name)
    schema = get_current_schema(request, schema_id, database)
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database, schema)
    })


@login_required
def schemas(request, db_name):
    database = get_current_database(request, db_name)
    return render(request, 'mathesar/index.html', {
        'common_data': get_common_data(request, database, None)
    })
