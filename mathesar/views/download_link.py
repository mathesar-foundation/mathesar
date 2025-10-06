import html
from django.conf import settings
from django.http import HttpResponse, StreamingHttpResponse, JsonResponse
from django.template.defaultfilters import filesizeformat
from django.views.decorators.http import require_http_methods
from functools import wraps
from mathesar.utils.forms import get_col_info_for_field
from mathesar.models.base import Form

from mathesar.utils.download_links import (
    get_link_contents, get_link_thumbnail, save_file
)


CACHE_HEADER = {"Cache-Control": "public, max-age=31536000, immutable"}


# The endpoints here are accessible anonymously via publicly shared forms.
# Checks such as these are currently not centralized. Refer https://github.com/mathesar-foundation/mathesar/issues/4846.
def require_log_in_or_access_via_shared_form(*, response_type="http"):
    def decorator(f):
        @wraps(f)
        def wrapped(request, *args, **kwargs):
            user = getattr(request, "user", None)
            if user and user.is_authenticated:
                return f(request, *args, **kwargs)

            form_token = request.GET.get("form_token")
            form_field_key = request.GET.get("form_field_key")
            if form_token and form_field_key:
                try:
                    form_model = Form.objects.get(token=form_token)
                    if form_model.publish_public:
                        column_info = get_col_info_for_field(form_model, form_field_key)
                        if column_info and column_info.get("metadata") and column_info["metadata"].get("file_backend"):
                            return f(request, *args, **kwargs)
                except Form.DoesNotExist:
                    pass

            if request.headers.get("Content-Type", "").startswith("application/json") or response_type == "json":
                return JsonResponse({"detail": "Unauthorized"}, status=401)

            return HttpResponse("Unauthorized", status=401)
        return wrapped
    return decorator


@require_log_in_or_access_via_shared_form()
@require_http_methods(["GET"])
def download_file(request, download_link_mash):
    stream_file, filename, content_type = get_link_contents(
        request.session.session_key, download_link_mash
    )
    disposition_header = {
        "Content-Disposition": f"attachment; filename={filename}"
    }
    response = StreamingHttpResponse(
        stream_file(),
        content_type=content_type,
        headers=CACHE_HEADER | disposition_header,
    )
    return response


@require_log_in_or_access_via_shared_form()
@require_http_methods(["GET"])
def load_file(request, download_link_mash):
    stream_file, _, content_type = get_link_contents(
        request.session.session_key, download_link_mash
    )
    security_header = {"Content-Security-Policy": "default-src 'none'"}
    return StreamingHttpResponse(
        stream_file(),
        content_type=content_type,
        headers=CACHE_HEADER | security_header,
    )


@require_log_in_or_access_via_shared_form()
@require_http_methods(["GET"])
def load_file_thumbnail(request, download_link_mash):
    thumbnail, content_type = get_link_thumbnail(
        request.session.session_key,
        download_link_mash,
        width=int(request.GET.get("width", 500)),
        height=int(request.GET.get("height", 500))
    )
    return HttpResponse(
        thumbnail, content_type=content_type, headers=CACHE_HEADER
    )


@require_log_in_or_access_via_shared_form(response_type="json")
@require_http_methods(["POST"])
def upload_file(request):
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"detail": "No file uploaded"}, status=400)

    user = getattr(request, "user", None)
    is_authenticated_user = user and user.is_authenticated

    if not is_authenticated_user and uploaded_file.size > settings.MATHESAR_PUBLIC_FILE_UPLOAD_MAX_SIZE:
        human_readable_size = _get_human_readable_file_size(settings.MATHESAR_PUBLIC_FILE_UPLOAD_MAX_SIZE)
        return JsonResponse(
            {"detail": f"Max allowed file size is {human_readable_size}"},
            status=400
        )

    return JsonResponse(save_file(request.FILES["file"], request))


def _get_human_readable_file_size(size):
    # Django's default `filesizeformat` returns html (- the &nbsp; character)
    human_readable_size = html.unescape(filesizeformat(size))
    return human_readable_size.replace("\xa0", " ")
