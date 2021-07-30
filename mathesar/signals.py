from django.db.models.signals import post_save
from django.dispatch import receiver

from mathesar.models import Table
from mathesar.reflection import reflect_new_table_constraints


@receiver(post_save, sender=Table)
def sync_table_constraints(sender, instance, created, **kwargs):
    # When a table is created, we want to immediately make the appropriate
    # Constraint model instances for that table's constraints.
    if created:
        reflect_new_table_constraints(instance)
