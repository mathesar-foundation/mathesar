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

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["host", "port"], name="unique_server"
            ),
        ]


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


class ConfiguredRole(BaseModel):
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
    configured_role = models.ForeignKey('ConfiguredRole', on_delete=models.CASCADE)
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
            user=self.configured_role.name,
            password=self.configured_role.password,
        )


class ColumnMetaData(BaseModel):
    database = models.ForeignKey('Database', on_delete=models.CASCADE)
    table_oid = models.PositiveBigIntegerField()
    attnum = models.SmallIntegerField()
    bool_input = models.CharField(
        choices=[("dropdown", "dropdown"), ("checkbox", "checkbox")],
        null=True
    )
    bool_true = models.CharField(null=True)
    bool_false = models.CharField(null=True)
    num_min_frac_digits = models.PositiveIntegerField(null=True)
    num_max_frac_digits = models.PositiveIntegerField(null=True)
    num_grouping = models.CharField(
        choices=[("always", "always"), ("auto", "auto"), ("never", "never")],
        null=True
    )
    num_format = models.CharField(
        choices=[("english", "english"), ("german", "german"), ("french", "french"), ("hindi", "hindi"), ("swiss", "swiss")],
        null=True
    )
    mon_currency_symbol = models.CharField(null=True)
    mon_currency_location = models.CharField(
        choices=[("after-minus", "after-minus"), ("end-with-space", "end-with-space")],
        null=True
    )
    time_format = models.CharField(null=True)
    date_format = models.CharField(null=True)
    duration_min = models.CharField(max_length=255, null=True)
    duration_max = models.CharField(max_length=255, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["database", "table_oid", "attnum"],
                name="unique_column_metadata"
            ),
            models.CheckConstraint(
                check=(
                    models.Q(num_max_frac_digits__lte=20)
                    & models.Q(num_min_frac_digits__lte=20)
                    & models.Q(num_min_frac_digits__lte=models.F("num_max_frac_digits"))
                ),
                name="frac_digits_integrity"
            )
        ]


class TableMetaData(BaseModel):
    database = models.ForeignKey('Database', on_delete=models.CASCADE)
    table_oid = models.PositiveBigIntegerField()
    data_file = models.ForeignKey("DataFile", on_delete=models.SET_NULL, null=True)
    import_verified = models.BooleanField(null=True)
    column_order = models.JSONField(null=True)
    record_summary_customized = models.BooleanField(null=True)
    record_summary_template = models.CharField(max_length=255, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["database", "table_oid"],
                name="unique_table_metadata"
            )
        ]


class Explorations(BaseModel):
    database = models.ForeignKey('Database', on_delete=models.CASCADE)
    name = models.CharField(max_length=128, unique=True)
    base_table_oid = models.PositiveBigIntegerField()
    schema_oid = models.PositiveBigIntegerField()
    initial_columns = models.JSONField()
    transformations = models.JSONField(null=True)
    display_options = models.JSONField(null=True)
    display_names = models.JSONField(null=True)
    description = models.CharField(null=True)
