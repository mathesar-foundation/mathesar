from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from mathesar.models import Table, Constraint
from mathesar.reflection import reflect_new_table_constraints
from db.constraints import drop_constraint


@receiver(post_save, sender=Table)
def create_new_constraints(sender, instance, created, **kwargs):
    if created:
        reflect_new_table_constraints(instance)


@receiver(pre_delete, sender=Constraint)
def drop_db_constraint(sender, instance, **kwargs):
    drop_constraint(
        instance.table._sa_table.name,
        instance.table._sa_table.schema,
        instance.table.schema._sa_engine,
        instance.name
    )
