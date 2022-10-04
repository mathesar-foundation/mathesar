from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Name fields are changed to mitigate some of the issues in
    # https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/
    # We can get by with a "full name" and "short name" to display in different contexts
    # Both are optional because we can always fall back on username
    first_name = None
    last_name = None
    full_name = models.CharField(max_length=255, blank=True, null=True)
    short_name = models.CharField(max_length=255, blank=True, null=True)
