from django.conf import settings
from django.http import FileResponse, HttpResponseNotFound, HttpResponseNotModified
from django.utils.http import http_date, parse_http_date_safe

from config.branding_config import (
    logo_content_type,
    logo_file_path_for_slot,
)


def logo_asset(request, slot):
    file_path = logo_file_path_for_slot(settings.MATHESAR_BRANDING_CONFIG, slot)
    if file_path is None:
        return HttpResponseNotFound()

    content_type = logo_content_type(file_path)
    if content_type is None:
        return HttpResponseNotFound()

    stat = file_path.stat()
    etag = f'W/"{stat.st_mtime_ns:x}-{stat.st_size:x}"'
    last_modified = http_date(stat.st_mtime)
    if _request_matches_validators(request, etag, stat.st_mtime):
        response = HttpResponseNotModified()
    else:
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
    response['Cache-Control'] = 'public, max-age=300'
    response['ETag'] = etag
    response['Last-Modified'] = last_modified
    response['X-Content-Type-Options'] = 'nosniff'
    if content_type == 'image/svg+xml':
        response['Content-Security-Policy'] = (
            "default-src 'none'; img-src data:; style-src 'unsafe-inline'"
        )
    return response


def _request_matches_validators(request, etag, modified_time):
    if_none_match = request.headers.get('If-None-Match')
    if if_none_match:
        return _if_none_match_matches(if_none_match, etag)

    if_modified_since = request.headers.get('If-Modified-Since')
    if not if_modified_since:
        return False

    requested_modified_time = parse_http_date_safe(if_modified_since)
    return (
        requested_modified_time is not None
        and int(modified_time) <= requested_modified_time
    )


def _if_none_match_matches(header_value, etag):
    return any(
        candidate == '*' or _weak_etag_value(candidate) == _weak_etag_value(etag)
        for candidate in (value.strip() for value in header_value.split(','))
    )


def _weak_etag_value(etag):
    return etag[2:] if etag.startswith('W/') else etag
