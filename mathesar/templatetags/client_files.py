import logging
import json
import os.path
from urllib.parse import urljoin
from django import template
from django.conf import settings
from django.utils.safestring import mark_safe


logger = logging.getLogger(__name__)
register = template.Library()

MODE = getattr(settings, "MODE")
CLIENT_BUILD_LOCATION = getattr(settings, "CLIENT_BUILD_LOCATION")
MANIFEST = os.path.join(CLIENT_BUILD_LOCATION, "manifest.json")

STATIC_URL = getattr(settings, "STATIC_URL")
CLIENT_DEV_URL = getattr(settings, "CLIENT_DEV_URL")


class ClientAssetHandler:
    _instance = None
    _inclusion_scripts = None

    @staticmethod
    def get_instance():
        if ClientAssetHandler._instance is None:
            ClientAssetHandler()
        return ClientAssetHandler._instance

    def __init__(self):
        if ClientAssetHandler._instance is not None:
            raise RuntimeError(
                "This is a Singleton. Use ClientAssetHandler.get_instance()"
            )
        else:
            ClientAssetHandler._instance = self

    @classmethod
    def load_scripts(self):
        try:
            manifest_file = open(MANIFEST, "r")
            content = manifest_file.read()
            manifest_file.close()
            manifest_data = json.loads(content)

            includes = []
            includes.append(self.get_module_includes(manifest_data))
            includes.append(self.get_legacy_includes(manifest_data))

            self._inclusion_scripts = "\n".join(includes)
            logger.info("Client build manifest file loaded")
        except Exception as e:
            raise RuntimeError(e)

    @staticmethod
    def get_module_includes(manifest_data):
        module = manifest_data["src/main.ts"]
        includes = []

        for css in module["css"]:
            css_url = urljoin(STATIC_URL, css)
            includes.append(
                f'<link rel="stylesheet" href="{css_url}">'
            )

        for imported_file in module["imports"]:
            vendor_file = urljoin(STATIC_URL, manifest_data[imported_file]["file"])
            includes.append(
                f'<link rel="modulepreload" href="{vendor_file}">'
            )

        main_path = urljoin(STATIC_URL, module["file"])
        includes.append(
            f'<script type="module" src="{main_path}"></script>'
        )

        return "\n".join(includes)

    @staticmethod
    def get_legacy_includes(manifest_data):
        legacy = manifest_data["src/main-legacy.ts"]
        polyfills = manifest_data["vite/legacy-polyfills"]
        includes = []

        polyfill_path = urljoin(STATIC_URL, polyfills["file"])
        includes.append(
            f'<script nomodule src="{polyfill_path}"></script>'
        )

        for imported_file in legacy["imports"]:
            vendor_file = urljoin(STATIC_URL, manifest_data[imported_file]["file"])
            includes.append(
                f'<script nomodule src="{vendor_file}"></script>'
            )

        main_path = urljoin(STATIC_URL, legacy["file"])
        includes.append(
            f'<script nomodule id="vite-legacy-entry" data-src="{main_path}">\n'
            f'\tSystem.import(document.getElementById("vite-legacy-entry").getAttribute("data-src"))\n'
            f'</script>'
        )

        return "\n".join(includes)

    @classmethod
    def get_assets(self):
        if self._inclusion_scripts is None:
            self.load_scripts()
        return self._inclusion_scripts


@register.simple_tag
@mark_safe
def get_assets():
    if MODE == "DEVELOPMENT":
        return (
            f'<script type="module" src="{CLIENT_DEV_URL}/@vite/client"></script>\n'
            f'<script type="module" src="{CLIENT_DEV_URL}/src/main.ts"></script>'
        )
    else:
        return ClientAssetHandler.get_instance().get_assets()
