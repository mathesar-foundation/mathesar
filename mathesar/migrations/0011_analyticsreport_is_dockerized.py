from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0010_server_sslmode'),
    ]

    operations = [
        migrations.AddField(
            model_name='analyticsreport',
            name='is_dockerized',
            field=models.BooleanField(null=True, blank=True),
        ),
    ]
