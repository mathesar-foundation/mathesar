from django.db.models.signals import post_save
from django.dispatch import receiver

from mathesar.models.base import Column, PreviewColumnSettings, Table, TableSettings
from mathesar.state.django import reflect_new_table_constraints
from mathesar.state import get_cached_metadata


@receiver(post_save, sender=Table)
def sync_table_constraints(**kwargs):
    # When a table is created, we want to immediately make the appropriate
    # Constraint model instances for that table's constraints.
    if kwargs['created']:
        reflect_new_table_constraints(get_cached_metadata(), kwargs['instance'])


@receiver(post_save, sender=Table)
def create_table_settings(**kwargs):
    if kwargs['created']:
        instance = kwargs['instance']
        preview_column_settings = PreviewColumnSettings.objects.create(customized=False)
        TableSettings.current_objects.create(table=instance, preview_settings=preview_column_settings)


@receiver(post_save, sender=Column)
def compute_preview_column_settings(**kwargs):
    instance = kwargs['instance']
    columns = Column.current_objects.filter(table_id=instance.table_id).order_by('attnum')
    preview_column = None
    primary_key_column = None
    for column in columns:
        if column.primary_key:
            primary_key_column = column
        else:
            preview_column = column
            break
    if preview_column is None:
        preview_column = primary_key_column
    preview_template = f"{{{preview_column.id}}}"
    preview_settings = instance.table.settings.preview_settings
    preview_settings.template = preview_template
    preview_settings.save()
