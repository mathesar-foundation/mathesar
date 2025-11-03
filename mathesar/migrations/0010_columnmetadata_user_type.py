# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0009_columnmetadata_file_backend'),
    ]

    operations = [
        migrations.AddField(
            model_name='columnmetadata',
            name='user_type',
            field=models.BooleanField(default=False, null=True),
        ),
    ]
