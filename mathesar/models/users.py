from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Override username max_length from Django's default 150 to 254
    # (RFC 5321 maximum email length). The managed-SaaS sign-up flow
    # sets username = email, so the field must accept any valid email.
    # The field is otherwise identical to AbstractUser.username (same
    # validator, same uniqueness, same error messages).
    username = models.CharField(
        max_length=254,
        unique=True,
        validators=[AbstractUser.username_validator],
        error_messages={
            'unique': 'A user with that username already exists.',
        },
    )
    # Name fields are changed to mitigate some of the issues in
    # https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/
    # We can get by with a "full name" and "short name" to display in different contexts
    # Both are optional because we can always fall back on username
    first_name = None
    last_name = None
    full_name = models.CharField(max_length=255, blank=True, null=True)
    short_name = models.CharField(max_length=255, blank=True, null=True)
    password_change_needed = models.BooleanField(default=False)
    display_language = models.CharField(max_length=30, blank=True, default='en')

    def metadata_privileges(self, database_id):
        return 'read write'
