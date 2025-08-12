import base64
import io
import mimetypes
from django.shortcuts import get_object_or_404
import fsspec
from PIL import Image
from mathesar.models import DownloadLink


def get_link_contents(request, download_link_id):
    link = get_object_or_404(
        DownloadLink,
        id=download_link_id,
        sessions=request.session.session_key,
    )
    content_type = mimetypes.guess_type(link.uri)[0]
    of = fsspec.open(link.uri, "rb", **link.fsspec_kwargs)
    filename = of.path

    def stream_file():
        with of as f:
            while scoop := f.read(512):
                yield scoop

    return stream_file, filename, content_type


def get_link_thumbnail(request, download_link_id):
    link = get_object_or_404(
        DownloadLink,
        id=download_link_id,
        sessions=request.session.session_key,
    )
    content_type = "image/jpeg"
    size = int(request.GET.get("width", 500)), int(request.GET.get("height", 500))
    key = f"{size[0]}x{size[1]}"

    if (thumb_64 := link.thumbnail.get(key)) is None:
        of = fsspec.open(link.uri, "rb", **link.fsspec_kwargs)
        img_byte_arr = io.BytesIO()
        with of as f:
            img = Image.open(f)
            img.thumbnail(size)
            img.save(img_byte_arr, format="JPEG")
        thumbnail = img_byte_arr.getvalue()
        link.thumbnail[key] = base64.b64encode(thumbnail).decode("utf-8")
        link.save()
    else:
        thumbnail = base64.b64decode(bytes(thumb_64, "utf-8"))

    return thumbnail, content_type
