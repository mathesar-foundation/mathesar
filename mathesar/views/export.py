import csv
from io import StringIO

from django.contrib.auth.decorators import login_required
from django import forms
from django.http import StreamingHttpResponse, JsonResponse

from mathesar.utils.explorations import exploration_chunker
from mathesar.rpc.utils import connect
from mathesar.rpc.records import Filter, OrderBy

from db.tables import fetch_table_in_chunks


class ExportExplorationQueryForm(forms.Form):
    database_id = forms.IntegerField(required=True)
    exploration_id = forms.IntegerField(required=True)
    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)


class ExportTableQueryForm(forms.Form):
    database_id = forms.IntegerField(required=True)
    table_oid = forms.IntegerField(required=True)
    filter = forms.JSONField(required=False)
    order = forms.JSONField(required=False)


def export_exploration_csv_in_chunks(
    user,
    database_id: int,
    exploration_id: int,
    **kwargs
):
    with connect(database_id, user) as conn:
        csv_buffer = StringIO()
        exploration_chunk_gen = exploration_chunker(conn, exploration_id, **kwargs)
        columns = next(exploration_chunk_gen)
        csv_writer = csv.DictWriter(csv_buffer, fieldnames=columns)

        csv_writer.writeheader()  # writes column name(s) to csv.
        value = csv_buffer.getvalue()
        yield value
        csv_buffer.seek(0)
        csv_buffer.truncate(0)

        for records in exploration_chunk_gen:
            csv_writer.writerows(records)
            value = csv_buffer.getvalue()
            yield value
            csv_buffer.seek(0)
            csv_buffer.truncate(0)


def stream_exploration_as_csv(
    request,
    database_id: int,
    exploration_id: int,
    limit: int,
    offset: int
) -> StreamingHttpResponse:
    user = request.user
    response = StreamingHttpResponse(
        export_exploration_csv_in_chunks(
            user,
            database_id,
            exploration_id,
            limit=limit,
            offset=offset
        ),
        content_type="text/csv"
    )
    response['Content-Disposition'] = 'attachment'
    return response


@login_required
def export_exploration(request):
    form = ExportExplorationQueryForm(request.GET)
    if form.is_valid():
        data = form.cleaned_data
        return stream_exploration_as_csv(
            request=request,
            database_id=data['database_id'],
            exploration_id=data['exploration_id'],
            limit=data['limit'],
            offset=data['offset']
        )
    else:
        return JsonResponse({'errors': form.errors}, status=400)


def export_table_csv_in_chunks(
    user,
    database_id: int,
    table_oid: int,
    **kwargs
):
    with connect(database_id, user) as conn:
        csv_buffer = StringIO()

        table_fetch_gen = fetch_table_in_chunks(conn, table_oid, **kwargs)
        columns = next(table_fetch_gen)
        csv_writer = csv.DictWriter(csv_buffer, fieldnames=columns.keys())

        csv_writer.writerow(columns)
        value = csv_buffer.getvalue()
        yield value
        csv_buffer.seek(0)
        csv_buffer.truncate(0)

        for records in table_fetch_gen:
            csv_writer.writerows(records)
            value = csv_buffer.getvalue()
            yield value
            csv_buffer.seek(0)
            csv_buffer.truncate(0)


def stream_table_as_csv(
    request,
    database_id: int,
    table_oid: int,
    limit: int = None,
    offset: int = None,
    order: list[OrderBy] = None,
    filter: Filter = None,
) -> StreamingHttpResponse:
    user = request.user
    response = StreamingHttpResponse(
        export_table_csv_in_chunks(
            user,
            database_id,
            table_oid,
            limit=limit,
            offset=offset,
            order=order,
            filter=filter,
        ),
        content_type="text/csv"
    )
    response['Content-Disposition'] = 'attachment'
    return response


@login_required
def export_table(request):
    form = ExportTableQueryForm(request.GET)
    if form.is_valid():
        data = form.cleaned_data
        return stream_table_as_csv(
            request=request,
            database_id=data['database_id'],
            table_oid=data['table_oid'],
            filter=data['filter'],
            order=data['order']
        )
    else:
        return JsonResponse({'errors': form.errors}, status=400)
