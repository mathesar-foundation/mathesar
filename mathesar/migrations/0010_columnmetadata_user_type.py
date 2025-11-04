# Generated manually

from django.db import migrations, models


def add_user_fields_if_missing(apps, schema_editor):
    """Add user_type and user_display_field columns if they don't exist."""
    with schema_editor.connection.cursor() as cursor:
        # Check and add user_type if missing
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'mathesar_columnmetadata'
            AND column_name = 'user_type'
        """)
        if not cursor.fetchone():
            cursor.execute("""
                ALTER TABLE mathesar_columnmetadata
                ADD COLUMN user_type BOOLEAN DEFAULT FALSE
            """)

        # Check and add user_display_field if missing
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'mathesar_columnmetadata'
            AND column_name = 'user_display_field'
        """)
        if not cursor.fetchone():
            cursor.execute("""
                ALTER TABLE mathesar_columnmetadata
                ADD COLUMN user_display_field VARCHAR(50) DEFAULT 'full_name' NOT NULL
            """)


def remove_user_fields_if_exists(apps, schema_editor):
    """Remove user_type and user_display_field columns if they exist."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE mathesar_columnmetadata
            DROP COLUMN IF EXISTS user_display_field,
            DROP COLUMN IF EXISTS user_type
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0009_columnmetadata_file_backend'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    add_user_fields_if_missing,
                    reverse_code=remove_user_fields_if_exists,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='columnmetadata',
                    name='user_type',
                    field=models.BooleanField(default=False, null=True),
                ),
                migrations.AddField(
                    model_name='columnmetadata',
                    name='user_display_field',
                    field=models.CharField(
                        choices=[("full_name", "full_name"), ("email", "email"), ("username", "username")],
                        default="full_name",
                        max_length=50,
                    ),
                ),
            ],
        ),
    ]
