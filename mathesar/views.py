from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from mathesar.database.collections import Collection
from mathesar.forms import UploadFileForm


def index(request):
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            collection = Collection.create_from_csv(request.FILES["file"])
    else:
        form = UploadFileForm()
    return render(
        request,
        "mathesar/index.html",
        {
            "form": form,
        },
    )


def collection_detail(request, pk):
    return render(request, "mathesar/collection_detail.html", {"collection": None})
