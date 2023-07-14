import uuid
from django.db import models

from mathesar.models.base import BaseModel


class SharedEntity(BaseModel):
    slug = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    enabled = models.BooleanField(default=True)

    class Meta:
        abstract = True


class SharedTable(SharedEntity):
    table = models.ForeignKey(
        'Table', on_delete=models.CASCADE, related_name='shared_table'
    )


class SharedQuery(SharedEntity):
    query = models.ForeignKey(
        'UIQuery', on_delete=models.CASCADE, related_name='shared_query'
    )
