from django.db.models.signals import post_save
from django.dispatch import receiver

from mathesar.models import Column, PreviewColumnSettings, Table, TableSettings
from mathesar.reflection import reflect_new_table_constraints


@receiver(post_save, sender=Table)
def sync_table_constraints(**kwargs):
    # When a table is created, we want to immediately make the appropriate
    # Constraint model instances for that table's constraints.
    if kwargs['created']:
        reflect_new_table_constraints(kwargs['instance'])


@receiver(post_save, sender=Table)
def create_table_settings(sender, instance, created, **kwargs):
    if created:
        preview_column_settings = PreviewColumnSettings.objects.create(customized=False)
        TableSettings.current_objects.create(table=instance, preview_columns=preview_column_settings)


@receiver(post_save, sender=Column)
def compute_preview_column_settings(sender, instance, created, **kwargs):
    if created:
        computed_preview_columns = [instance.id]
        if instance.primary_key:
            instance.table.table_settings.preview_columns.columns.set(computed_preview_columns)
