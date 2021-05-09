from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.generic import DetailView

from mathesar.forms.forms import UploadFileForm
from mathesar.imports.csv import create_table_from_csv
from mathesar.models import Table, Schema
from mathesar.serializers import SchemaSerializer, TableSerializer, RecordSerializer
from mathesar.database.utils import get_non_default_database_keys

def get_common_data(request):
    schema_serializer = SchemaSerializer(Schema.objects.all(), many=True, context={'request': request})
    return {
        "schemas": schema_serializer.data,
        "databases": get_non_default_database_keys(),
    }

def index(request):
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            table = create_table_from_csv(
                name=form.cleaned_data["table_name"],
                schema=form.cleaned_data["schema_name"],
                database_key=form.cleaned_data["database_key"],
                csv_file=request.FILES["file"]
            )
            return JsonResponse({"pk": table.id}, status=200)
    return render(
        request,
        "mathesar/index.html",
        {
            "common_data": get_common_data(request),
        }
    )

def table(request, pk):
    try:
        table_data = Table.objects.get(pk=pk)
        table_serialized = TableSerializer(table_data, context={'request': request}).data
        records_serialized = RecordSerializer(table_data.get_records(limit=50, offset=0), many=True, context={'request': request}).data
    except Table.DoesNotExist:
        table_serialized = {}
        records_serialized = {}
    return render(
        request,
        "mathesar/index.html",
        {
            "common_data": get_common_data(request),
            "route_specific_data": {
                "table-detail": table_serialized,
                "table-records": records_serialized
            }
        }
    )
