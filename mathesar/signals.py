from django.db.models.signals import post_save
from django.dispatch import receiver

from mathesar.models.base import (
    Column, Table, _compute_preview_template,
    _create_table_settings,
)
from mathesar.state.django import reflect_new_table_constraints


@receiver(post_save, sender=Table)
def sync_table_constraints(**kwargs):
    # When a table is created, we want to immediately make the appropriate
    # Constraint model instances for that table's constraints.
    if kwargs['created']:
        reflect_new_table_constraints(kwargs['instance'])


@receiver(post_save, sender=Table)
def create_table_settings(**kwargs):
    if kwargs['created']:
        instance = kwargs['instance']
        _create_table_settings([instance])


@receiver(post_save, sender=Column)
def compute_preview_column_settings(**kwargs):
    instance = kwargs['instance']
    _compute_preview_template(instance.table)
