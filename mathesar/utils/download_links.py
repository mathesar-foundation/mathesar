import base64
import cairosvg
import datetime
import hashlib
import io
import json
import mimetypes
import posixpath
from django.conf import settings
from django.contrib.sessions.models import Session
from django.shortcuts import get_object_or_404
from django.urls import reverse
import fsspec
from PIL import Image, UnidentifiedImageError
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
    filename = _get_filename_for_uri(link.uri)

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
    content_type = "image/avif"
    size = width, height
    key = f"{size[0]}x{size[1]}"

    if (thumb_64 := link.thumbnail.get(key)) is None:
        of = fsspec.open(link.uri, "rb", **link.fsspec_kwargs)
        thumbnail = _build_thumbnail_bytes(of, size)
        link.thumbnail[key] = base64.b64encode(thumbnail).decode("utf-8")
        link.save()
    else:
        thumbnail = base64.b64decode(bytes(thumb_64, "utf-8"))

    return thumbnail, content_type


def _build_thumbnail_bytes(of, size, format="AVIF", quality=50):
    img_byte_arr = io.BytesIO()
    with of as f:
        try:
            img = Image.open(f)
        except UnidentifiedImageError:
            f.seek(0)
            interm_bytes = io.BytesIO()
            cairosvg.svg2png(file_obj=f, write_to=interm_bytes)
            img = Image.open(interm_bytes)
        img.thumbnail(size)
        img.save(img_byte_arr, format=format, quality=quality)
    return img_byte_arr.getvalue()


def create_mash_for_uri(uri, backend_key):
    return hashlib.sha256(
        settings.SECRET_KEY.encode('utf-8')
        + backend_key.encode('utf-8')
        + uri.encode('utf-8')
    ).hexdigest()


def create_json_for_uri(uri, backend_key):
    return json.dumps(
        {URI: uri, MASH: create_mash_for_uri(uri, backend_key)},
        sort_keys=True
    )


def _get_filename_for_uri(uri):
    return posixpath.split(uri)[-1]


def get_download_links(request, results, keys):
    return {
        key: get_links_details(
            request,
            sync_links_from_json_strings(
                request.session.session_key, [r[key] for r in results]
            )
        )
        for key in (str(k) for k in keys)
    }


def get_links_details(request, links):
    return {
        link.mash: _get_single_link_details(request, link)
        for link in links
    }


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
    backends = get_backends()
    return [
        DownloadLink(
            mash=v.get(MASH),
            uri=v.get(URI),
            fsspec_kwargs=backends[b]["kwargs"]
        )
        for (v, b)
        in (_build_valid_link_dict(p, backends) for p in json_strs)
        if v is not None and b is not None
    ]


def save_file(f, request, backend_key='default'):
    backend = get_backends()[backend_key]
    now = datetime.datetime.now().strftime('%Y%m%d-%H%M%S%f')
    uri = f"{backend['protocol']}://{backend['prefix']}/{request.user}/{now}/{f.name}"
    of = fsspec.open(uri, mode='xb', **backend["kwargs"])
    with of as destination:
        for chunk in f.chunks():
            destination.write(chunk)

    result = create_json_for_uri(uri, backend_key)
    link = sync_links_from_json_strings(request.session.session_key, [result])[0]
    return {
        "result": result,
        "download_link": _get_single_link_details(request, link)
    }


def _build_valid_link_dict(result, backends):
    output = None, None
    try:
        result_dict = json.loads(result)
        for b in backends:
            if result_dict[MASH] == create_mash_for_uri(result_dict[URI], b):
                output = result_dict, b
    except Exception:  # We really don't want to stop execution here for anything
        pass
    return output


def _get_single_link_details(request, link):

    def _link(url_name):
        return _build_file_link(request, url_name, link.mash)

    return {
        "uri": link.uri,
        "name": _get_filename_for_uri(link.uri),
        "mimetype": _mimetype(link.uri),
        "thumbnail": _link("files_thumbnail") if _is_image(link.uri) else None,
        "attachment": _link("files_download"),
        "direct": _link("files_direct"),
    }


def _mimetype(path):
    return mimetypes.guess_type(path or "", strict=False)[0]


def _build_file_link(request, url_name, mash):
    link_kwargs = {"download_link_mash": mash}
    return request.build_absolute_uri(reverse(url_name, kwargs=link_kwargs))


def _is_image(path):
    mimetype_str = _mimetype(path) or ""
    return mimetype_str.split("/")[0] == "image"


def get_backends(public_info=False):
    try:
        with open(BACKEND_CONF_YAML, 'r') as f:
            backend_dict = yaml.full_load(f)
    except FileNotFoundError:
        backend_dict = {}
    if public_info is True:
        return list(backend_dict.keys())
    else:
        return backend_dict
