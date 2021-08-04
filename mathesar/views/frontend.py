from django.shortcuts import render, redirect

from mathesar.models import Database, Schema
from mathesar.serializers import DatabaseSerializer, SchemaSerializer


def get_schemas(request, database):
    schema_serializer = SchemaSerializer(
        Schema.objects.filter(database__name=database),
        many=True,
        context={'request': request}
    )
    return schema_serializer.data


def get_databases(request):
    database_serializer = DatabaseSerializer(
        Database.objects.all(),
        many=True,
        context={'request': request}
    )
    return database_serializer.data


def get_render_info(request, **kwargs):
    requested_db = kwargs.get('dbname')
    requested_schema = kwargs.get('schema')
    is_db_updated = False
    is_schema_updated = False

    database_list = get_databases(request)

    # This block check if db is none or invalid, and if true, redirects to the first db.
    # If db is invalid, and no dbs are configured, sets requested_db to None
    #   - Mathesar wont start in this case, but if we plan to show a specific error page, or
    #     allow initial start of Mathesar without a db in the future, this will be essential.
    if (requested_db is None or next((x for x in database_list if x.get('name') == requested_db), None) is None):
        if len(database_list) > 0:
            requested_db = database_list[0].get('name')
            is_db_updated = True
        elif requested_db is not None:
            requested_db = None
            is_db_updated = True

    schema_list = get_schemas(request, requested_db)

    # Performs the same checks as above, but for schemas
    if (requested_schema is None or next((x for x in schema_list if x.get('id') == requested_schema), None) is None):
        if len(schema_list) > 0:
            requested_schema = schema_list[0].get('id')
            is_schema_updated = True
        elif requested_schema is not None:
            requested_schema = None
            is_schema_updated = True

    return {
        'is_db_updated': is_db_updated,
        'is_schema_updated': is_schema_updated,
        'common_data': {
            'selected_db': requested_db,
            'selected_schema': requested_schema,
            'schemas': schema_list,
            'databases': database_list
        }
    }


def index(request, **kwargs):
    render_info = get_render_info(request, **kwargs)
    common_data = render_info.get('common_data')
    selected_db = common_data.get('selected_db')
    selected_schema = common_data.get('selected_schema')

    if render_info.get('is_db_updated') or render_info.get('is_schema_updated'):
        return redirect('index', dbname=selected_db, schema=selected_schema)

    if selected_db is not None and selected_schema is None:
        return redirect('schemas', dbname=selected_db)

    return render(
        request,
        "mathesar/index.html",
        {
            "common_data": common_data
        }
    )


def schemas(request, **kwargs):
    render_info = get_render_info(request, **kwargs)
    common_data = render_info.get('common_data')
    selected_db = common_data.get('selected_db')

    if render_info.get('is_db_updated'):
        return redirect('schemas', dbname=selected_db)

    common_data['selected_schema'] = None

    return render(
        request,
        "mathesar/index.html",
        {
            "common_data": common_data
        }
    )
