"""This module contains logic for setting up custom display options."""
from demo.install.base import (
    LIBRARY_MANAGEMENT, MATHESAR_CON,
    get_dj_column_by_name, get_dj_schema_by_name, get_dj_table_by_name,
)
from mathesar.models.base import PreviewColumnSettings


def customize_settings(engine):
    """Set preview settings so demo data looks good."""
    _customize_library_preview_settings(engine)
    _customize_devcon_preview_settings(engine)


def _customize_library_preview_settings(engine):
    schema = get_dj_schema_by_name(engine, LIBRARY_MANAGEMENT)
    authors = get_dj_table_by_name(schema, 'Authors')
    _set_first_and_last_names_preview(authors)
    patrons = get_dj_table_by_name(schema, 'Patrons')
    _set_first_and_last_names_preview(patrons)


def _customize_devcon_preview_settings(engine):
    schema = get_dj_schema_by_name(engine, MATHESAR_CON)
    presenters = get_dj_table_by_name(schema, 'Presenters')
    _set_first_and_last_names_preview(presenters)


def _set_first_and_last_names_preview(table):
    first_name = get_dj_column_by_name(table, 'First Name')
    last_name = get_dj_column_by_name(table, 'Last Name')
    template = f'{{{first_name.id}}} {{{last_name.id}}}'
    new_preview_settings = PreviewColumnSettings.objects.create(
        customized=True, template=template
    )
    table.settings.preview_settings = new_preview_settings
    table.settings.save()
