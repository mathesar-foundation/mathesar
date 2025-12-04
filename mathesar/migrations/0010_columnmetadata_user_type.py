# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mathesar", "0009_columnmetadata_file_backend"),
    ]

    operations = [
        migrations.AddField(
            model_name="columnmetadata",
            name="user_display_field",
            field=models.CharField(
                choices=[
                    ("full_name", "full_name"),
                    ("email", "email"),
                    ("username", "username"),
                ],
                max_length=50,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="columnmetadata",
            name="track_editing_user",
            field=models.BooleanField(default=False),
        ),
    ]
