import ast
from pathlib import Path

from whitenoise.compress import Compressor, brotli_installed


def test_staticfiles_storage_can_precompress_brotli_assets():
    settings_path = (
        Path(__file__).parents[2]
        / "config"
        / "settings"
        / "common_settings.py"
    )
    settings_module = ast.parse(settings_path.read_text())
    staticfiles_storage = next(
        node.value.value
        for node in settings_module.body
        if isinstance(node, ast.Assign)
        for target in node.targets
        if isinstance(target, ast.Name) and target.id == "STATICFILES_STORAGE"
    )

    assert staticfiles_storage == "whitenoise.storage.CompressedManifestStaticFilesStorage"
    assert brotli_installed is True
    assert Compressor().use_brotli is True
