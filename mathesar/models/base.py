from django.db import models
from encrypted_fields.fields import EncryptedCharField


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Server(BaseModel):
    host = models.CharField(max_length=255)
    port = models.IntegerField()


class Database(BaseModel):
    name = models.CharField(max_length=128)
    server = models.ForeignKey(
        'Server', on_delete=models.CASCADE, related_name='databases'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "server"], name="unique_database"
            )
        ]


class Role(BaseModel):
    name = models.CharField(max_length=255)
    server = models.ForeignKey(
        'Server', on_delete=models.CASCADE, related_name='roles'
    )
    password = EncryptedCharField(max_length=255)


class UserDatabaseRoleMap(BaseModel):
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    database = models.ForeignKey('Database', on_delete=models.CASCADE)
    role = models.ForeignKey('Role', on_delete=models.CASCADE)
    server = models.ForeignKey('Server', on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "database"], name="user_one_role_per_database"
            )
        ]
