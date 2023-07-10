import uuid
from django.db import models

from mathesar.models.base import BaseModel


class PublishedLink(BaseModel):
    slug = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    enabled = models.BooleanField(default=True)

    class Meta:
        abstract = True


class PublishedTableLink(PublishedLink):
    table = models.ForeignKey(
        'Table', on_delete=models.CASCADE, related_name='published_links'
    )


class PublishedQueryLink(PublishedLink):
    query = models.ForeignKey(
        'UIQuery', on_delete=models.CASCADE, related_name='published_links'
    )
