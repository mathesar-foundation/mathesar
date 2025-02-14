from django.db import migrations, models
import encrypted_fields.fields


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0002_custom_db_server_integrity_constraints'),
    ]

    operations = [
        migrations.AlterField(
            model_name='configuredrole',
            name='password',
            field=encrypted_fields.fields.EncryptedCharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='database',
            name='nickname',
            field=models.CharField(null=True),
        ),
        migrations.AddField(
            model_name='columnmetadata',
            name='display_width',
            field=models.PositiveIntegerField(null=True),
        ),
    ]
