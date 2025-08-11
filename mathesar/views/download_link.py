import mimetypes
from django.contrib.auth.decorators import login_required
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_http_methods
import fsspec

from mathesar.models import DownloadLink


@login_required
@require_http_methods(["GET"])
def download_file(request, download_link_id):
    stream_file, of, content_type = _get_link_contents(request, download_link_id)
    response = StreamingHttpResponse(stream_file(of), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename={of.path}'
    return response


@login_required
@require_http_methods(["GET"])
def load_file(request, download_link_id):
    stream_file, of, content_type = _get_link_contents(request, download_link_id)
    return StreamingHttpResponse(stream_file(of), content_type=content_type)


def _get_link_contents(request, download_link_id):
    link = get_object_or_404(
        DownloadLink,
        id=download_link_id,
        session=request.session.session_key,
    )
    content_type = mimetypes.guess_type(link.uri)[0]
    of = fsspec.open(link.uri, "rb")

    def stream_file(of):
        with of as f:
            while scoop := f.read(512):
                yield scoop

    return stream_file, of, content_type
