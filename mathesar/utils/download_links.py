import base64
import hashlib
import io
import itertools
import json
import mimetypes
import posixpath
from django.conf import settings
from django.contrib.sessions.models import Session
from django.shortcuts import get_object_or_404
from django.urls import reverse
import fsspec
from PIL import Image
import yaml
from mathesar.models import DownloadLink

BACKEND_CONF_YAML = settings.BASE_DIR.joinpath('file_storage.yml')
URI = "uri"
MASH = "mash"


def get_link_contents(session_key, download_link_mash):
    link = get_object_or_404(
        DownloadLink,
        mash=download_link_mash,
        sessions=session_key,
    )
    content_type = _mimetype(link.uri)
    of = fsspec.open(link.uri, "rb", **link.fsspec_kwargs)
    filename = posixpath.split(of.path)[-1]

    def stream_file():
        with of as f:
            while scoop := f.read(512):
                yield scoop

    return stream_file, filename, content_type


def get_link_thumbnail(session_key, download_link_mash, width=500, height=500):
    link = get_object_or_404(
        DownloadLink,
        mash=download_link_mash,
        sessions=session_key,
    )
    content_type = "image/jpeg"
    size = width, height
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


def create_json_for_uri(uri, backend_key):
    return json.dumps({URI: uri, MASH: create_mash_for_uri(uri, backend_key)})


def get_download_links(request, results, keys):
    return {
        key: get_links_details(
            request,
            sync_links_from_json_strings(request.session.session_key, [r[key] for r in results])
        )
        for key in (str(k) for k in keys)
    }


def get_links_details(request, links):
    return {
        link.mash: {
            "uri": link.uri,
            "mimetype": _mimetype(link.uri),
            "thumbnail": request.build_absolute_uri(
                reverse("files_thumbnail", kwargs={"download_link_mash": link.mash})
            ) if _is_image(link.uri) else None,
            "attachment": request.build_absolute_uri(
                reverse("files_download", kwargs={"download_link_mash": link.mash})
            ),
            "direct": request.build_absolute_uri(
                reverse("files_direct", kwargs={"download_link_mash": link.mash})
            )
        }
        for link in links
    }


def _is_image(path):
    mimetype_str = _mimetype(path) or ""
    return mimetype_str.split("/")[0] == "image"


def _mimetype(path):
    return mimetypes.guess_type(path or "", strict=False)[0]


def sync_links_from_json_strings(session_key, json_strs):
    """
    Given an iterable of json strings:
      - determine which key Mathesar can use for access
      - build missing DownloadLinks
      - gather preexisting DownloadLinks
      - Add user's session to all
    """
    links = DownloadLink.objects.bulk_create(
        build_links_from_json(json_strs), ignore_conflicts=True
    )
    session = Session.objects.get(session_key=session_key)
    session.downloadlink_set.add(*links)
    return links


def build_links_from_json(json_strs):
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
        DownloadLink(
            mash=v.get(MASH),
            uri=v.get(URI),
            fsspec_kwargs=backends[b]["kwargs"]
        )
        for v, b in itertools.product((json.loads(p) for p in json_strs), backends)
        if v[MASH] == create_mash_for_uri(v.get(URI, ""), b)
    ]
