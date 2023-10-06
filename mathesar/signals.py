from django.db.models.signals import post_save
from django.dispatch import receiver

from mathesar.models.base import (
    Database, Column, Table, _set_default_preview_template,
    _create_table_settings,
)
from mathesar.state.django import reflect_new_table_constraints


# TODO consider moving; seems like a bad idea to keep these separately from the
# classes they hook into; I (Dom) always forget that these exist and are part
# of given model's logic.


@receiver(post_save, sender=Database)
def reflect_database_after_changes(**kwargs):
    """
    Upon mutation disposes of the cached engine and resets reflection.

    Accounts for these edge cases: db connection credentials may have
    changed, and, the db may be totally different.
    """
    db_instance = kwargs['instance']
    db_instance._dispose_cached_engine()
    db_instance.reset_reflection()


@receiver(post_save, sender=Table)
def sync_table_constraints(**kwargs):
    # When a table is created, we want to immediately make the appropriate
    # Constraint model instances for that table's constraints.
    if kwargs['created']:
        # TODO BUG partial reflects are dangerous, do reset_reflection(...) instead
        reflect_new_table_constraints(kwargs['instance'])


@receiver(post_save, sender=Table)
def create_table_settings(**kwargs):
    if kwargs['created']:
        instance = kwargs['instance']
        _create_table_settings([instance])


@receiver(post_save, sender=Column)
def compute_preview_column_settings(**kwargs):
    instance = kwargs['instance']
    _set_default_preview_template(instance.table)
