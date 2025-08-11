import mimetypes
from django.shortcuts import get_object_or_404
import fsspec
from mathesar.models import DownloadLink


def get_link_contents(request, download_link_id):
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
