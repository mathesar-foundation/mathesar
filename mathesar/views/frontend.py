from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.generic import DetailView

from mathesar.forms.forms import UploadFileForm
from mathesar.imports.csv import create_table_from_csv
from mathesar.models import Table


def index(request):
    tables = Table.objects.all()
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            table = create_table_from_csv(
                form.cleaned_data["table_name"],
                form.cleaned_data["schema_name"],
                request.FILES["file"]
            )
            return HttpResponseRedirect(
                reverse("frontend-table-detail", kwargs={"pk": table.id})
            )
    else:
        form = UploadFileForm()
    return render(
        request,
        "mathesar/index.html",
        {
            "form": form,
            "tables": sorted(tables, key=lambda x: x.schema.name),
        },
    )


class TableDetail(DetailView):
    context_object_name = "table"
    queryset = Table.objects.all()
