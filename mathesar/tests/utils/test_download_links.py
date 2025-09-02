"""
Test download link utility functions.
"""
import datetime
from django.contrib.sessions.models import Session
from unittest.mock import MagicMock
from mathesar.utils import download_links as dl


def test_get_download_links(monkeypatch):
    request = MagicMock()
    request.session = Session.objects.create(
        session_key='mysupercoolsession',
        expire_date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
    )

    def mock_file_link(_, url_name, mash):
        return f'http://a-link-here/?url_name={url_name}&mash={mash}'

    monkeypatch.setattr(dl, "_build_file_link", mock_file_link)

    def mock_backends():
        return {
            "test_backend": {
                "protocol": "s3",
                "nickname": "for testing",
                "kwargs": {"bleh": "blah"},
            },
            "test_backend_google": {
                "protocol": "gs",
                "nickname": "for testing google",
                "kwargs": {"bleh": "blah"},
            },
        }

    monkeypatch.setattr(dl, "_get_backends", mock_backends)

    uri_pic = dl.create_json_for_uri("s3://bleh/pic.jpeg", "test_backend")
    uri_pdf = dl.create_json_for_uri("s3://bleh/document.pdf", "test_backend")

    # We use `create_json_for_uri`, since the main goal is to verify
    # that the output of that function matches up with assumptions of
    # other functions.
    results = [
        {"1": "abcde", "strcolname": 23423, "files": uri_pic},
        {"1": "defgh", "strcolname": 23412, "files": uri_pdf},
    ]

    assert dl.get_download_links(request, results, ["files"]) == {
        "files": {
            "6fd854e72cd5397e8fc621d769239f9d1179b6d58a160a60381f166df5f554bb": {
                "attachment": "http://a-link-here/?url_name=files_download&mash=6fd854e72cd5397e8fc621d769239f9d1179b6d58a160a60381f166df5f554bb",
                "direct": "http://a-link-here/?url_name=files_direct&mash=6fd854e72cd5397e8fc621d769239f9d1179b6d58a160a60381f166df5f554bb",
                "mimetype": "application/pdf",
                "thumbnail": None,
                "uri": "s3://bleh/document.pdf",
            },
            "d41bb2858a5a03810771fac0154d3dbd28a3b3542ad0c97ab2baf67eeaef7299": {
                "attachment": "http://a-link-here/?url_name=files_download&mash=d41bb2858a5a03810771fac0154d3dbd28a3b3542ad0c97ab2baf67eeaef7299",
                "direct": "http://a-link-here/?url_name=files_direct&mash=d41bb2858a5a03810771fac0154d3dbd28a3b3542ad0c97ab2baf67eeaef7299",
                "mimetype": "image/jpeg",
                "thumbnail": "http://a-link-here/?url_name=files_thumbnail&mash=d41bb2858a5a03810771fac0154d3dbd28a3b3542ad0c97ab2baf67eeaef7299",
                "uri": "s3://bleh/pic.jpeg",
            },
        },
    }
