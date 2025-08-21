import base64
import hashlib
import io
import itertools
import json
import mimetypes
import posixpath
from django.conf import settings
from django.shortcuts import get_object_or_404
import fsspec
from PIL import Image
import yaml
from mathesar.models import DownloadLink

BACKEND_CONF_YAML = settings.BASE_DIR.joinpath('file_storage.yml')

def get_link_contents(request, download_link_id):
    link = get_object_or_404(
        DownloadLink,
        id=download_link_id,
        sessions=request.session.session_key,
    )
    content_type = mimetypes.guess_type(link.uri)[0]
    of = fsspec.open(link.uri, "rb", **link.fsspec_kwargs)
    filename = posixpath.split(of.path)[-1]

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


def create_mash_for_uri(uri, backend_key):
    return hashlib.md5(
        settings.SECRET_KEY.encode('utf-8')
        + backend_key.encode('utf-8')
        + uri.encode('utf-8')
    ).hexdigest()


def build_links_from_json(jsons):
    """
    Takes an iterable of JSON strings having "uri" and "mash" keys, and creates
    DownloadLinks from them.
    - matches each JSON URI and mash pair to the correct backend key for the
      mash.
    - Creates download links for each.
    """
    with open(BACKEND_CONF_YAML, 'r') as f:
        backends = yaml.full_load(f)
    return [
        DownloadLink(uri=v.get("uri"), fsspec_kwargs=backends[b]["kwargs"])
        for v, b in itertools.product((json.loads(p) for p in json_strs), backends)
        if v["mash"] == create_mash_for_uri(v.get("uri", ""), b)
    ]
