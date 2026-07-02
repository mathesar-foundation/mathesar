# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mathesar", "0010_server_sslmode"),
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
            model_name="tablemetadata",
            name="user_tracking_attnum",
            field=models.SmallIntegerField(null=True),
        ),
    ]
