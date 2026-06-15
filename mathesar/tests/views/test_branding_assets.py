import pytest

from config.branding_config import BrandingConfig


def test_logo_asset_serves_configured_svg(client, settings, tmp_path):
    logo = tmp_path / 'logo.svg'
    logo.write_text('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    settings.MATHESAR_BRANDING_CONFIG = BrandingConfig(
        asset_dir=str(tmp_path),
        logo_files={'auth': 'logo.svg'},
    )

    response = client.get('/branding-assets/auth/')

    assert response.status_code == 200
    assert response['Content-Type'] == 'image/svg+xml'
    assert response['Cache-Control'] == 'public, max-age=300'
    assert response['X-Content-Type-Options'] == 'nosniff'
    assert response['Content-Security-Policy'] == (
        "default-src 'none'; img-src data:; style-src 'unsafe-inline'"
    )
    assert b''.join(response.streaming_content) == (
        b'<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    )


def test_logo_asset_returns_304_for_matching_etag(client, settings, tmp_path):
    logo = tmp_path / 'logo.svg'
    logo.write_text('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    settings.MATHESAR_BRANDING_CONFIG = BrandingConfig(
        asset_dir=str(tmp_path),
        logo_files={'auth': 'logo.svg'},
    )
    first_response = client.get('/branding-assets/auth/')

    response = client.get(
        '/branding-assets/auth/',
        HTTP_IF_NONE_MATCH=first_response['ETag'],
    )

    assert response.status_code == 304
    assert response['ETag'] == first_response['ETag']
    assert response['Last-Modified'] == first_response['Last-Modified']
    assert response['X-Content-Type-Options'] == 'nosniff'


def test_logo_asset_returns_304_for_matching_last_modified(client, settings, tmp_path):
    logo = tmp_path / 'logo.svg'
    logo.write_text('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    settings.MATHESAR_BRANDING_CONFIG = BrandingConfig(
        asset_dir=str(tmp_path),
        logo_files={'auth': 'logo.svg'},
    )
    first_response = client.get('/branding-assets/auth/')

    response = client.get(
        '/branding-assets/auth/',
        HTTP_IF_MODIFIED_SINCE=first_response['Last-Modified'],
    )

    assert response.status_code == 304
    assert response['ETag'] == first_response['ETag']
    assert response['Last-Modified'] == first_response['Last-Modified']


def test_logo_asset_serves_configured_png(client, settings, tmp_path):
    logo = tmp_path / 'logo.png'
    logo.write_bytes(b'not-really-a-png')
    settings.MATHESAR_BRANDING_CONFIG = BrandingConfig(
        asset_dir=str(tmp_path),
        logo_files={'app-header': 'logo.png'},
    )

    response = client.get('/branding-assets/app-header/')

    assert response.status_code == 200
    assert response['Content-Type'] == 'image/png'
    assert response['X-Content-Type-Options'] == 'nosniff'
    assert 'Content-Security-Policy' not in response


@pytest.mark.parametrize('slot', ['missing', 'app-header-dark'])
def test_logo_asset_returns_404_without_configured_slot(client, settings, tmp_path, slot):
    settings.MATHESAR_BRANDING_CONFIG = BrandingConfig(asset_dir=str(tmp_path))

    response = client.get(f'/branding-assets/{slot}/')

    assert response.status_code == 404


def test_logo_asset_returns_404_for_file_outside_asset_dir(client, settings, tmp_path):
    outside = tmp_path.parent / 'outside-logo.svg'
    outside.write_text('<svg />')
    (tmp_path / 'logo.svg').symlink_to(outside)
    settings.MATHESAR_BRANDING_CONFIG = BrandingConfig(
        asset_dir=str(tmp_path),
        logo_files={'auth': 'logo.svg'},
    )

    response = client.get('/branding-assets/auth/')

    assert response.status_code == 404
