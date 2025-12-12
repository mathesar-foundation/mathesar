# Generated manually for issue #4974
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0009_columnmetadata_file_backend'),
    ]

    operations = [
        migrations.AddField(
            model_name='database',
            name='default_upgrade_role',
            field=models.ForeignKey(
                blank=True,
                help_text='The default configured role to use for database upgrades',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='default_for_databases',
                to='mathesar.configuredrole'
            ),
        ),
    ]
