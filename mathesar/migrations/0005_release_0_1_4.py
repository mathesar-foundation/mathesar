from django.db import migrations, models, connection
import django.contrib.postgres.fields
import encrypted_fields.fields


def column_order_to_jsonb_postgres_fwd(apps, schema_editor):
    if connection.settings_dict['ENGINE'].startswith('django.db.backends.postgresql'):
        schema_editor.execute('ALTER TABLE mathesar_tablesettings ALTER column_order TYPE jsonb USING array_to_json(column_order)')

    # Adds validators, converts type on SQLite
    migrations.AlterField(
        model_name='tablesettings',
        name='column_order',
        field=models.JSONField(blank=True, default=None, null=True),
    ),


def column_order_to_jsonb_postgres_rev(apps, schema_editor):
    if connection.settings_dict['ENGINE'].startswith('django.db.backends.postgresql'):
        schema_editor.execute('ALTER TABLE mathesar_tablesettings ALTER column_order TYPE integer[] USING translate(column_order::text, \'[]\', \'{}\')::integer[]')
    else:
        # Reverts to the initial state as mentioned in 0001_initial.py for the sake of consistency
        migrations.AlterField(
            model_name='tablesettings',
            name='column_order',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(), default=None, null=True, size=None),
        )


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0004_shares'),
    ]

    operations = [
        migrations.AddField(
            model_name='database',
            name='db_name',
            field=models.CharField(default='', max_length=128),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='database',
            name='host',
            field=models.CharField(default='', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='database',
            name='password',
            field=encrypted_fields.fields.EncryptedCharField(default='mathesar', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='database',
            name='port',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='database',
            name='username',
            field=encrypted_fields.fields.EncryptedCharField(default='mathesar', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='datafile',
            name='sheet_index',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='user',
            name='display_language',
            field=models.CharField(blank=True, default='en', max_length=30),
        ),
        migrations.AlterField(
            model_name='constraint',
            name='oid',
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name='schema',
            name='oid',
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name='table',
            name='oid',
            field=models.PositiveIntegerField(),
        ),
        migrations.RunPython(column_order_to_jsonb_postgres_fwd, column_order_to_jsonb_postgres_rev),
    ]
