# Generated by Django 4.2.18 on 2025-05-14 16:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0004_tablemetadata_mathesar_added_pkey_attnum'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='server',
            name='unique_server',
        ),
        migrations.AlterField(
            model_name='server',
            name='port',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddConstraint(
            model_name='server',
            constraint=models.UniqueConstraint(condition=models.Q(('port__isnull', False)), fields=('host', 'port'), name='unique_server_host_port_not_null'),
        ),
        migrations.AddConstraint(
            model_name='server',
            constraint=models.UniqueConstraint(condition=models.Q(('port__isnull', True)), fields=('host',), name='unique_server_null_port'),
        ),
    ]
