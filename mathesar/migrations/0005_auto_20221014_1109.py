# Generated by Django 3.1.14 on 2022-10-14 11:09

from django.db import migrations, models
import mathesar.models.query


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0004_auto_20221009_1324'),
    ]

    operations = [
        migrations.AlterField(
            model_name='uiquery',
            name='display_options',
            field=models.JSONField(blank=True, null=True, validators=[mathesar.models.query.ListOfDictValidator]),
        ),
        migrations.AlterField(
            model_name='uiquery',
            name='initial_columns',
            field=models.JSONField(validators=[mathesar.models.query.ListOfDictValidator, mathesar.models.query.InitialColumnsValidator]),
        ),
        migrations.AlterField(
            model_name='uiquery',
            name='transformations',
            field=models.JSONField(blank=True, null=True, validators=[mathesar.models.query.ListOfDictValidator, mathesar.models.query.TransformationsValidator]),
        ),
    ]
