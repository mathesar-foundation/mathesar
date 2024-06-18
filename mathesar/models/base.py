from django.db import models
from encrypted_fields.fields import EncryptedCharField
import psycopg


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
            ),
            models.UniqueConstraint(
                fields=["id", "server"], name="database_id_server_index"
            )
        ]


class Role(BaseModel):
    name = models.CharField(max_length=255)
    server = models.ForeignKey(
        'Server', on_delete=models.CASCADE, related_name='roles'
    )
    password = EncryptedCharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "server"], name="unique_role"
            ),
            models.UniqueConstraint(
                fields=["id", "server"], name="role_id_server_index"
            )
        ]


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


    @property
    def connection(self):
        return psycopg.connect(
            host=self.server.host,
            port=self.server.port,
            dbname=self.database.name,
            user=self.role.name,
            password=self.role.password,
        )
