import os

from django.conf import settings
from django.db import models
from encrypted_fields.fields import EncryptedCharField
import psycopg

from db.sql.install import uninstall, install
from db.analytics import get_object_counts
from mathesar import __version__
from mathesar.models import exceptions


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
    nickname = models.CharField(null=True)
    server = models.ForeignKey(
        'Server', on_delete=models.CASCADE, related_name='databases'
    )
    last_confirmed_sql_version = models.CharField(default='0.0.0')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "server"], name="unique_database"
            ),
            models.UniqueConstraint(
                fields=["id", "server"], name="database_id_server_index"
            )
        ]

    @property
    def object_counts(self):
        for role_map in UserDatabaseRoleMap.objects.filter(database=self):
            try:
                with role_map.connection as conn:
                    return get_object_counts(conn)
            except Exception:
                pass
        else:
            raise exceptions.NoConnectionAvailable

    @property
    def needs_upgrade_attention(self):
        return self.last_confirmed_sql_version != __version__

    def install_sql(self, username=None, password=None):
        if username is not None and password is not None:
            with self.connect_manually(username, password) as conn:
                install(conn)
        else:
            with self.connect_admin() as conn:
                install(conn)

        self.last_confirmed_sql_version = __version__
        self.save()

    def uninstall_sql(
            self,
            schemas_to_remove=['msar', '__msar', 'mathesar_types'],
            strict=True,
            role_name=None,
            password=None,
    ):
        if role_name is not None and password is not None:
            with self.connect_manually(role_name, password) as conn:
                uninstall(
                    conn, schemas_to_remove=schemas_to_remove, strict=strict,
                )
        else:
            with self.connect_admin() as conn:
                uninstall(
                    conn, schemas_to_remove=schemas_to_remove, strict=strict,
                )

    def connect_user(self, user):
        """Return the given user's connection to the database."""
        try:
            role_map = UserDatabaseRoleMap.objects.get(user=user, database=self)
        except UserDatabaseRoleMap.DoesNotExist:
            raise exceptions.NoConnectionAvailable
        return role_map.connection

    def connect_manually(self, role, password):
        """Return a connection to the Database using the role and password."""
        return psycopg.connect(
            host=self.server.host,
            port=self.server.port,
            dbname=self.name,
            user=role,
            password=password,
        )

    def connect_admin(self):
        """
        Return a connection using the role that installed Mathesar.

        Note that this function should be used with care, since the
        connection has privileges to modify Mathesar's system schemata.
        """
        admin_role_query = """
        SELECT nspowner::regrole::text
        FROM pg_catalog.pg_namespace
        WHERE nspname='msar';
        """

        for role_map in UserDatabaseRoleMap.objects.filter(database=self):
            try:
                with role_map.connection as conn:
                    admin_role_name = conn.execute(admin_role_query).fetchone()[0]
                    assert admin_role_name is not None
                    break
            except Exception:
                pass
        else:
            raise exceptions.NoConnectionAvailable

        try:
            role = ConfiguredRole.objects.get(
                name=admin_role_name, server=self.server
            )
        except ConfiguredRole.DoesNotExist:
            raise exceptions.NoAdminConnectionAvailable

        return self.connect_manually(role.name, role.password)


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
    record_summary_template = models.JSONField(null=True)

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


class DataFile(BaseModel):
    def _user_directory_path(instance, filename):
        user_identifier = instance.user.username if instance.user else 'anonymous'
        # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
        return os.path.join(user_identifier, filename)

    created_from_choices = models.TextChoices("created_from", "FILE PASTE URL")
    file_type_choices = models.TextChoices("type", "CSV TSV JSON")

    file = models.FileField(upload_to=_user_directory_path)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_from = models.CharField(max_length=128, choices=created_from_choices.choices)
    type = models.CharField(max_length=128, choices=file_type_choices.choices)
    base_name = models.CharField(max_length=100)
    header = models.BooleanField(default=True)
    max_level = models.IntegerField(default=0, blank=True)
    sheet_index = models.IntegerField(default=0)
    delimiter = models.CharField(max_length=1, default=',', blank=True)
    escapechar = models.CharField(max_length=1, blank=True)
    quotechar = models.CharField(max_length=1, default='"', blank=True)
