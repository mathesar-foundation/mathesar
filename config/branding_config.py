from dataclasses import dataclass, field
import base64
import colorsys
import logging
import re
from pathlib import Path, PurePath
from urllib.parse import urlparse


logger = logging.getLogger(__name__)

MAX_LOGO_DATA_URL_LENGTH = 100_000
MAX_LOGO_FILE_SIZE = 250_000
ALLOWED_LOGO_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.svg', '.webp'}
ALLOWED_LOGO_MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
}

HEX_COLOR_RE = re.compile(r'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$')
DATA_IMAGE_RE = re.compile(
    r'^data:image/(?P<mime>svg\+xml|png|jpe?g|webp);base64,(?P<data>.+)$',
    re.IGNORECASE,
)

COLOR_INTENSITIES = {
    '5': 0.05,
    '10': 0.10,
    '15': 0.15,
    '20': 0.20,
    '25': 0.25,
    '40': 0.40,
    '60': 0.60,
    '80': 0.80,
}

UTILITY_COLOR_STATES = {
    'hover': (0, 3, -3),
    'focused': (0, 0, -4),
    'active': (0, 0, -7),
}

COLOR_SETTINGS = {
    'brandAccent': {
        'env': 'MATHESAR_THEME_COLOR_BRAND_ACCENT',
        'token': 'brand',
    },
    'mutedBrandAccent': {
        'env': 'MATHESAR_THEME_COLOR_MUTED_BRAND_ACCENT',
        'token': 'brand-subtle',
    },
    'primaryAction': {
        'env': 'MATHESAR_THEME_COLOR_PRIMARY_ACTION',
        'token': 'action-primary',
    },
    'secondaryAction': {
        'env': 'MATHESAR_THEME_COLOR_SECONDARY_ACTION',
        'token': 'action-secondary',
    },
    'navigationAccent': {
        'env': 'MATHESAR_THEME_COLOR_NAVIGATION_ACCENT',
        'token': 'navigation',
    },
    'referenceAccent': {
        'env': 'MATHESAR_THEME_COLOR_REFERENCE_ACCENT',
        'token': 'highlight-a',
    },
    'focusAccent': {
        'env': 'MATHESAR_THEME_COLOR_FOCUS_ACCENT',
        'token': 'highlight-b',
    },
    'confirmationAccent': {
        'env': 'MATHESAR_THEME_COLOR_CONFIRMATION_ACCENT',
        'token': 'highlight-c',
    },
    'databaseIdentity': {
        'env': 'MATHESAR_THEME_COLOR_DATABASE_IDENTITY',
        'token': 'database',
    },
    'schemaIdentity': {
        'env': 'MATHESAR_THEME_COLOR_SCHEMA_IDENTITY',
        'token': 'schema',
    },
    'tableIdentity': {
        'env': 'MATHESAR_THEME_COLOR_TABLE_IDENTITY',
        'token': 'table',
    },
    'viewIdentity': {
        'env': 'MATHESAR_THEME_COLOR_VIEW_IDENTITY',
        'token': 'view',
    },
    'columnIdentity': {
        'env': 'MATHESAR_THEME_COLOR_COLUMN_IDENTITY',
        'token': 'column',
    },
    'recordIdentity': {
        'env': 'MATHESAR_THEME_COLOR_RECORD_IDENTITY',
        'token': 'record',
    },
    'foreignRecordIdentity': {
        'env': 'MATHESAR_THEME_COLOR_FOREIGN_RECORD_IDENTITY',
        'token': 'record-fk',
    },
    'explorationIdentity': {
        'env': 'MATHESAR_THEME_COLOR_EXPLORATION_IDENTITY',
        'token': 'exploration',
    },
    'dataFormIdentity': {
        'env': 'MATHESAR_THEME_COLOR_DATA_FORM_IDENTITY',
        'token': 'data-form',
    },
}

LOGO_SLOTS = {
    'auth': {
        'url_env': 'MATHESAR_AUTH_LOGO_URL',
        'file_env': 'MATHESAR_AUTH_LOGO_FILE',
    },
    'app-header': {
        'url_env': 'MATHESAR_APP_HEADER_LOGO_URL',
        'file_env': 'MATHESAR_APP_HEADER_LOGO_FILE',
    },
    'app-header-dark': {
        'url_env': 'MATHESAR_APP_HEADER_LOGO_DARK_URL',
        'file_env': 'MATHESAR_APP_HEADER_LOGO_DARK_FILE',
    },
}


@dataclass(frozen=True)
class BrandingConfig:
    asset_dir: str | None = None
    logo_urls: dict[str, str] = field(default_factory=dict)
    logo_files: dict[str, str] = field(default_factory=dict)
    colors: dict[str, str] = field(default_factory=dict)
    css: str = ''


def load_branding_config(env):
    colors = _load_colors(env)
    config = BrandingConfig(
        asset_dir=_env_value(env, 'MATHESAR_BRANDING_ASSET_DIR'),
        logo_urls=_load_logo_urls(env),
        logo_files=_load_logo_files(env),
        colors=colors,
        css=build_branding_css(colors),
    )
    return config


def build_branding_css(colors):
    if not colors:
        return ''
    declarations = []
    for public_name, color in colors.items():
        token = COLOR_SETTINGS[public_name]['token']
        declarations.extend(_utility_color_declarations(token, color))
    declarations_text = '\n'.join(f'  {name}: {value};' for name, value in declarations)
    return f'body.mathesar-has-branding {{\n{declarations_text}\n}}'


def logo_url_for_slot(branding_config, slot):
    if slot not in LOGO_SLOTS:
        return None
    if branding_config.logo_urls.get(slot):
        return branding_config.logo_urls[slot]
    if (
        branding_config.asset_dir
        and branding_config.logo_files.get(slot)
        and logo_file_path_for_slot(branding_config, slot)
    ):
        return f'/branding-assets/{slot}/'
    return None


def logo_file_path_for_slot(branding_config, slot):
    if slot not in LOGO_SLOTS:
        return None
    filename = branding_config.logo_files.get(slot)
    if not (branding_config.asset_dir and filename):
        return None
    try:
        asset_dir = Path(branding_config.asset_dir).expanduser()
        if not asset_dir.is_absolute():
            return None
        asset_dir = asset_dir.resolve(strict=True)
        file_path = (asset_dir / filename).resolve(strict=True)
        file_path.relative_to(asset_dir)
    except (FileNotFoundError, OSError, ValueError):
        return None
    if not file_path.is_file() or file_path.suffix.lower() not in ALLOWED_LOGO_EXTENSIONS:
        return None
    try:
        if file_path.stat().st_size > MAX_LOGO_FILE_SIZE:
            logger.warning("Branding logo file '%s' is too large; skipping.", file_path)
            return None
    except OSError:
        return None
    return file_path


def logo_content_type(file_path):
    return ALLOWED_LOGO_MIME_TYPES.get(file_path.suffix.lower())


def _load_colors(env):
    colors = {}
    for public_name, config in COLOR_SETTINGS.items():
        value = _env_value(env, config['env'])
        if not value:
            continue
        normalized = _normalize_hex_color(value)
        if normalized:
            colors[public_name] = normalized
        else:
            logger.warning(
                "Branding color '%s' must be a 3- or 6-digit hex color; skipping.",
                config['env'],
            )
    return colors


def _load_logo_urls(env):
    urls = {}
    for slot, config in LOGO_SLOTS.items():
        value = _env_value(env, config['url_env'])
        if not value:
            continue
        if _is_allowed_logo_url(value):
            urls[slot] = value
        else:
            logger.warning("Branding logo URL '%s' is not allowed; skipping.", config['url_env'])
    return urls


def _load_logo_files(env):
    files = {}
    for slot, config in LOGO_SLOTS.items():
        value = _env_value(env, config['file_env'])
        if not value:
            continue
        if _is_allowed_logo_filename(value):
            files[slot] = value
        else:
            logger.warning(
                "Branding logo file '%s' must be a filename with a supported image extension; skipping.",
                config['file_env'],
            )
    return files


def _env_value(env, name):
    return (env.get(name) or '').strip() or None


def _normalize_hex_color(value):
    value = value.strip()
    if not HEX_COLOR_RE.match(value):
        return None
    if len(value) == 4:
        value = '#' + ''.join(character * 2 for character in value[1:])
    return value.lower()


def _is_allowed_logo_url(value):
    if len(value) > MAX_LOGO_DATA_URL_LENGTH and value.lower().startswith('data:'):
        return False
    if _is_allowed_logo_data_url(value):
        return True
    if value.startswith('/') and not value.startswith('//'):
        return True
    parsed = urlparse(value)
    return parsed.scheme in {'http', 'https'} and bool(parsed.netloc)


def _is_allowed_logo_data_url(value):
    match = DATA_IMAGE_RE.match(value)
    if not match:
        return False
    try:
        base64.b64decode(match.group('data'), validate=True)
    except Exception:
        return False
    return True


def _is_allowed_logo_filename(value):
    path = PurePath(value)
    return (
        not path.is_absolute()
        and len(path.parts) == 1
        and path.parts[0] not in {'.', '..'}
        and path.suffix.lower() in ALLOWED_LOGO_EXTENSIONS
    )


def _utility_color_declarations(token, color):
    hue, saturation, lightness = _hex_to_hsl(color)
    declarations = [(f'--color-{token}', color)]
    for intensity, alpha in COLOR_INTENSITIES.items():
        declarations.append((
            f'--color-{token}-{intensity}',
            f'hsla({_fmt(hue)}, {_fmt(saturation)}%, {_fmt(lightness)}%, {_fmt(alpha)})',
        ))
    for state, (delta_hue, delta_saturation, delta_lightness) in UTILITY_COLOR_STATES.items():
        state_hue = (hue + delta_hue) % 360
        state_saturation = _clamp(saturation + delta_saturation, 0, 100)
        state_lightness = _clamp(lightness + delta_lightness, 0, 100)
        declarations.append((
            f'--color-{token}-{state}',
            f'hsl({_fmt(state_hue)}, {_fmt(state_saturation)}%, {_fmt(state_lightness)}%)',
        ))
        for intensity, alpha in COLOR_INTENSITIES.items():
            declarations.append((
                f'--color-{token}-{intensity}-{state}',
                (
                    f'hsla({_fmt(state_hue)}, {_fmt(state_saturation)}%, '
                    f'{_fmt(state_lightness)}%, {_fmt(alpha)})'
                ),
            ))
    return declarations


def _hex_to_hsl(color):
    color = _normalize_hex_color(color)
    red = int(color[1:3], 16) / 255
    green = int(color[3:5], 16) / 255
    blue = int(color[5:7], 16) / 255
    hue, lightness, saturation = colorsys.rgb_to_hls(red, green, blue)
    return hue * 360, saturation * 100, lightness * 100


def _clamp(value, min_value, max_value):
    return max(min_value, min(max_value, value))


def _fmt(value):
    rounded = round(value, 3)
    if rounded == int(rounded):
        return str(int(rounded))
    return f'{rounded:g}'
