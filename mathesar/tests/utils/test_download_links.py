"""
Test download link utility functions.
"""
import datetime
from django.contrib.sessions.models import Session
from unittest.mock import MagicMock
from mathesar.models.base import DownloadLink
from mathesar.utils import download_links as dl


def test_get_download_links(monkeypatch):
    first_session_key = 'mysupercoolsession',
    request = MagicMock()
    request.session = Session.objects.create(
        session_key=first_session_key,
        expire_date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
    )

    def mock_file_link(_, url_name, mash):
        return f'http://a-link-here/?url_name={url_name}&mash={mash}'

    monkeypatch.setattr(dl, "_build_file_link", mock_file_link)

    BACKEND_KEY = "test_backend"

    def mock_backends():
        return {
            BACKEND_KEY: {
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

    monkeypatch.setattr(dl, "get_backends", mock_backends)

    # We use `create_json_for_uri`, since the main goal is to verify
    # that the output of that function matches up with assumptions of
    # other functions.
    uri_pic = "s3://bleh/pic.jpeg"
    uri_pdf = "s3://bleh/document.pdf"

    results = [
        {"1": "abcde", "strcolname": 23423, "files": dl.create_json_for_uri(uri_pic, BACKEND_KEY)},
        {"1": "defgh", "strcolname": 23412, "files": dl.create_json_for_uri(uri_pdf, BACKEND_KEY)},
        {"1": "ghijk", "strcolname": 23451, "files": None},  # should not throw error; ignore
        {"1": "ghijk", "strcolname": 23451, "files": '{"invalid": "blob"}'},  # should not throw error; ignore
    ]

    expect_pic_mash = dl.create_mash_for_uri(uri_pic, BACKEND_KEY)
    expect_pdf_mash = dl.create_mash_for_uri(uri_pdf, BACKEND_KEY)

    # Since this is the first call, this should also create DownloadLinks under
    # the hood.

    actual_output = dl.get_download_links(request, results, ["files"])
    assert actual_output == {
        "files": {
            expect_pdf_mash: {
                "attachment": mock_file_link(None, "files_download", expect_pdf_mash),
                "direct": mock_file_link(None, "files_direct", expect_pdf_mash),
                "mimetype": "application/pdf",
                "name": "document.pdf",
                # No thumbnail, since it's a PDF.
                "thumbnail": None,
                "uri": "s3://bleh/document.pdf",
            },
            expect_pic_mash: {
                "attachment": mock_file_link(None, "files_download", expect_pic_mash),
                "direct": mock_file_link(None, "files_direct", expect_pic_mash),
                "mimetype": "image/jpeg",
                "name": "pic.jpeg",
                "thumbnail": mock_file_link(None, "files_thumbnail", expect_pic_mash),
                "uri": "s3://bleh/pic.jpeg",
            },
        },
    }

    download_links = DownloadLink.objects.all()
    assert download_links.count() == 2
    for li in download_links:
        assert li.sessions.filter(session_key=first_session_key).count() == 1

    second_session_key = 'mysupercoolsession2',
    request = MagicMock()
    request.session = Session.objects.create(
        session_key=second_session_key,
        expire_date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)
    )

    # Test with another session.
    actual_output = dl.get_download_links(request, results, ["files"])
    assert actual_output == {
        "files": {
            expect_pdf_mash: {
                "attachment": mock_file_link(None, "files_download", expect_pdf_mash),
                "direct": mock_file_link(None, "files_direct", expect_pdf_mash),
                "mimetype": "application/pdf",
                "name": "document.pdf",
                "thumbnail": None,
                "uri": "s3://bleh/document.pdf",
            },
            expect_pic_mash: {
                "attachment": mock_file_link(None, "files_download", expect_pic_mash),
                "direct": mock_file_link(None, "files_direct", expect_pic_mash),
                "mimetype": "image/jpeg",
                "name": "pic.jpeg",
                "thumbnail": mock_file_link(None, "files_thumbnail", expect_pic_mash),
                "uri": "s3://bleh/pic.jpeg",
            },
        },
    }

    download_links = DownloadLink.objects.all()
    # Should resuse Download links.
    assert download_links.count() == 2
    # Should leave old session, and add new to each Download link.
    for li in download_links:
        assert li.sessions.filter(session_key=first_session_key).count() == 1
        assert li.sessions.filter(session_key=second_session_key).count() == 1
