from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.generic import DetailView

from mathesar.forms import UploadFileForm
from mathesar.imports.csv import create_collection_from_csv
from mathesar.models import Collection


def index(request):
    collections = Collection.objects.all()
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            collection = create_collection_from_csv(form.cleaned_data["name"],
                                                    request.FILES["file"])
            return HttpResponseRedirect(
                reverse("collection-detail", kwargs={"pk": collection.id})
            )
    else:
        form = UploadFileForm()
    return render(
        request,
        "mathesar/index.html",
        {"form": form, "collections": collections},
    )


class CollectionDetail(DetailView):
    context_object_name = "collection"
    queryset = Collection.objects.all()
