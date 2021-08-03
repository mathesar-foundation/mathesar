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

def index(request, **kwargs):
    requested_db = kwargs.get('dbname')
    database_list = get_databases(request)

    # If no db is requested or if the requested db is not present, redirect to first available db
    if (requested_db is None or next((x for x in database_list if x.get('name') == requested_db), None) is None) and len(database_list) > 0:
        return redirect('index', dbname=database_list[0].get('name'))

    # Send database list and schemas for selected db to the template
    return render(
        request,
        "mathesar/index.html",
        {
            "common_data": {
                "schemas": get_schemas(request, requested_db),
                "databases": database_list
            }
        }
    )
