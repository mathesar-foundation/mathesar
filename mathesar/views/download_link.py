from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods

from mathesar.utils.download_links import get_link_contents, get_link_thumbnail


@login_required
@require_http_methods(["GET"])
def download_file(request, download_link_mash):
    stream_file, filename, content_type = get_link_contents(
        request.session.session_key, download_link_mash
    )
    response = StreamingHttpResponse(stream_file(), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename={filename}'
    return response


@login_required
@require_http_methods(["GET"])
def load_file(request, download_link_mash):
    stream_file, _, content_type = get_link_contents(
        request.session.session_key, download_link_mash
    )
    return StreamingHttpResponse(stream_file(), content_type=content_type)


@login_required
@require_http_methods(["GET"])
def load_file_thumbnail(request, download_link_mash):
    thumbnail, content_type = get_link_thumbnail(
        request.session.session_key,
        download_link_mash,
        width=int(request.GET.get("width", 500)),
        height=int(request.GET.get("height", 500))
    )
    return HttpResponse(thumbnail, content_type=content_type)
