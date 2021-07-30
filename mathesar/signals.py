from django.db.models.signals import post_save
from django.dispatch import receiver

from mathesar.models import Table
from mathesar.reflection import reflect_new_table_constraints


@receiver(post_save, sender=Table)
def create_new_constraints(sender, instance, created, **kwargs):
    if created:
        reflect_new_table_constraints(instance)
