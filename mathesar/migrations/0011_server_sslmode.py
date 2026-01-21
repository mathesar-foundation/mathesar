# Generated migration for adding sslmode field to Server model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0010_columnmetadata_user_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='server',
            name='sslmode',
            field=models.CharField(
                choices=[
                    ('disable', 'disable'),
                    ('prefer', 'prefer'),
                    ('require', 'require'),
                ],
                default='prefer',
                max_length=20,
            ),
        ),
    ]
