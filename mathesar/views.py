from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from mathesar.database.collections import Collection
from mathesar.forms import UploadFileForm


def index(request):
    collections = Collection.all()
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            collection = Collection.create_from_csv(request.FILES["file"])
            return HttpResponseRedirect(
                reverse("collection-detail", kwargs={"collection": collection})
            )
    else:
        form = UploadFileForm()
    return render(
        request,
        "mathesar/index.html",
        {"form": form, "collections": [collection.data for collection in collections]},
    )


def collection_detail(request, uuid=None, collection=None):
    if not collection:
        collection = Collection.get_from_uuid(str(uuid))
    return render(
        request, "mathesar/collection_detail.html", {"collection": collection.data}
    )
