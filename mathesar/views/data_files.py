import requests
import json

from django import forms
from django.http import JsonResponse
from django.utils.encoding import force_str
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required

from mathesar.errors import InvalidTableError, URLDownloadError
from mathesar.utils.datafiles import create_datafile
from mathesar.models.base import DataFile

SUPPORTED_URL_CONTENT_TYPES = {'text/csv', 'text/plain'}


class DataFileForm(forms.Form):
    file = forms.FileField(required=False, max_length=100)
    header = forms.BooleanField(required=False)
    delimiter = forms.CharField(required=False)
    escapechar = forms.CharField(required=False)
    quotechar = forms.CharField(required=False)
    paste = forms.CharField(required=False, empty_value=None, strip=False)
    url = forms.URLField(required=False, empty_value=None)

    # TODO: consider removing, these are left
    # from when we had infra for uploading json & excel files
    max_level = forms.IntegerField(initial=0, required=False)
    sheet_index = forms.IntegerField(initial=0, required=False)

    def __init__(self, request, *args, **kwargs):
        if request.content_type == 'multipart/form-data':
            self.data = request.POST
        else:
            self.data = json.loads(request.body)
        self.file = request.FILES
        super().__init__(self.data, self.file, *args, **kwargs)
        self.request = request

    def clean(self):
        cleaned_data = super().clean()

        # Only include fields that were present in the initial request.
        fields_from_request = list(self.data.keys()) + list(self.file.keys())
        cleaned_data = {k: v for k, v in cleaned_data.items() if k in fields_from_request}

        if self.request.method == "POST":
            source_fields = ['file', 'paste', 'url']
            present_fields = [
                field for field in source_fields
                if field in cleaned_data.keys()
                and cleaned_data[field] is not None
            ]
            if len(present_fields) > 1:
                raise forms.ValidationError(
                    f'Multiple source fields passed: {present_fields}.'
                    f' Only one of {source_fields} should be specified.',
                )
            elif len(present_fields) == 0:
                raise forms.ValidationError(
                    f'One of {source_fields} should be specified.'
                )
        return cleaned_data

    def clean_url(self):
        url = self.cleaned_data.get('url')
        if url:
            try:
                response = requests.head(url, allow_redirects=True)
            except requests.exceptions.ConnectionError:
                raise forms.ValidationError(
                    "URL cannot be reached."
                )

            content_type = response.headers.get('content-type')
            if not any(x in content_type for x in SUPPORTED_URL_CONTENT_TYPES):
                # sometimes content_type includes charset info e.g. (text/plain; charset=utf-8)
                # so, we check whether any supported content types are present in the content_type string,
                # and raise an error if content_type is unsupported.
                raise forms.ValidationError(
                    f"URL resource '{content_type}' not a valid type."
                )
        return url


@require_http_methods(["GET", "POST"])
@login_required
def list_or_create_data_file(request):
    user = request.user

    def datafile_to_dict(df: DataFile):
        return {
            "id": df.id,
            "file": request.build_absolute_uri(df.file.url),
            "user": df.user.id,
            "header": df.header,
            "delimiter": df.delimiter,
            "escapechar": df.escapechar,
            "quotechar": df.quotechar,
            "created_from": df.created_from,
            # TODO: remove?
            "max_level": df.max_level,
            "sheet_index": df.sheet_index
        }

    if request.method == 'GET':
        # List data files
        if user.is_superuser:
            data_files = DataFile.objects.all()
        else:
            data_files = DataFile.objects.all().filter(user=user)
        data_files = [datafile_to_dict(df) for df in data_files]
        return JsonResponse(
            {
                "count": len(data_files),
                "results": data_files
            },
            status=200
        )

    elif request.method == 'POST':
        form = DataFileForm(request)
        if form.is_valid():
            data = form.cleaned_data
            try:
                df = create_datafile(data, user)
            except InvalidTableError:
                return JsonResponse(
                    {"errors": "Unable to tabulate data."},
                    status=400
                )
            except URLDownloadError:
                return JsonResponse(
                    {"errors": "URL cannot be downloaded."},
                    status=400
                )
            except Exception as e:
                return JsonResponse(
                    {"errors": f"Unable to create DataFile. {force_str(e)}"},
                    status=400
                )
            return JsonResponse(datafile_to_dict(df), status=201)
        else:
            return JsonResponse({"errors": form.errors}, status=400)

    else:
        # Control should never reach here
        return JsonResponse({"errors": "Unknown error occured"}, status=400)


@require_http_methods(["GET", "PATCH"])
@login_required
def get_or_patch_data_file(request, data_file_id):
    user = request.user
    if data_file_id is None:
        return JsonResponse({"errors": "data_file_id is required."}, status=400)

    try:
        data_file = DataFile.objects.get(id=data_file_id, user=user)
    except DataFile.DoesNotExist:
        return JsonResponse(
            {"errors": "No DataFile matches the given query."},
            status=404
        )

    def datafile_to_dict(df: DataFile):
        return {
            "id": df.id,
            "file": request.build_absolute_uri(df.file.url),
            "user": df.user.id,
            "header": df.header,
            "delimiter": df.delimiter,
            "escapechar": df.escapechar,
            "quotechar": df.quotechar,
            "created_from": df.created_from,
            # TODO: remove?
            "max_level": df.max_level,
            "sheet_index": df.sheet_index
        }

    if request.method == 'GET':
        # Get a data file
        return JsonResponse(
            datafile_to_dict(data_file),
            status=200
        )

    elif request.method == 'PATCH':
        form = DataFileForm(request)
        if form.is_valid():
            data = form.cleaned_data
            if data.get('header') is not None:
                data_file.header = data['header']
                data_file.save()
                return JsonResponse(
                    datafile_to_dict(data_file),
                    status=200
                )
            else:
                return JsonResponse(
                    {"errors": 'Method "PATCH" allowed only for header.'},
                    status=405
                )
        else:
            return JsonResponse({"errors": form.errors}, status=400)

    else:
        # Control should never reach here
        return JsonResponse({"errors": "Unknown error occured"}, status=400)
