from django.contrib.auth.decorators import login_required
from django.http import StreamingHttpResponse
from django.views.decorators.http import require_http_methods

from mathesar.utils.download_links import get_link_contents


@login_required
@require_http_methods(["GET"])
def download_file(request, download_link_id):
    stream_file, of, content_type = get_link_contents(request, download_link_id)
    response = StreamingHttpResponse(stream_file(of), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename={of.path}'
    return response


@login_required
@require_http_methods(["GET"])
def load_file(request, download_link_id):
    stream_file, of, content_type = get_link_contents(request, download_link_id)
    return StreamingHttpResponse(stream_file(of), content_type=content_type)
