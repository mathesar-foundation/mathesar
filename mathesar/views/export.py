import csv
import subprocess
from io import StringIO, BytesIO

from psycopg import sql
from django.contrib.auth.decorators import login_required
from django import forms
from django.http import StreamingHttpResponse, JsonResponse, FileResponse

from mathesar.rpc.utils import connect
from mathesar.rpc.records import Filter, OrderBy
from mathesar.rpc.schemas import get_schema

from db.tables import fetch_table_in_chunks


class ExportSchemaQueryForm(forms.Form):
    database_id = forms.IntegerField(required=True)
    schema_oid = forms.IntegerField(required=True)


class ExportTableQueryForm(forms.Form):
    database_id = forms.IntegerField(required=True)
    table_oid = forms.IntegerField(required=True)
    filter = forms.JSONField(required=False)
    order = forms.JSONField(required=False)


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


def dump_schema(request, database_id, schema_oid):
    user = request.user
    with connect(database_id, user) as conn:
        schema_name = get_schema(schema_oid, conn)['name']
        pg_dump_cmd = [
            'pg_dump',
            '-h', conn.info.host,
            '-p', str(conn.info.port),
            '-U', conn.info.user,
            '-d', conn.info.dbname,
            '-n', sql.Identifier(schema_name).as_string(),
            '-O'  # Don't include owner info in the dump
        ]
        db_pass = {'PGPASSWORD': conn.info.password}
    process = subprocess.Popen(
        pg_dump_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=db_pass
    )
    dump_data, err = process.communicate()
    assert process.returncode == 0, 'Schema export failed: ' + err.decode('utf-8')
    dump_file = BytesIO(dump_data)
    dump_file.seek(0)
    return FileResponse(
        dump_file,
        as_attachment=True,
        content_type='application/sql'
    )


@login_required
def export_schema(request):
    form = ExportSchemaQueryForm(request.GET)
    if form.is_valid():
        data = form.cleaned_data
        return dump_schema(
            request,
            database_id=data['database_id'],
            schema_oid=data['schema_oid']
        )
    else:
        return JsonResponse({'errors': form.errors}, status=400)


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
