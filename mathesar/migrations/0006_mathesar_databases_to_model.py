from decouple import config as decouple_config
from django.conf import settings
from django.db import migrations


def update_conn_info(apps, _):
    """Add info from MATHESAR_DATABASES to new model fields."""
    Database = apps.get_model('mathesar', 'Database')
    django_db_key = decouple_config('DJANGO_DATABASE_KEY', default="default")
    user_databases = [key for key in settings.DATABASES if key != django_db_key]
    for database_key in user_databases:
        try:
            db = Database.current_objects.get(name=database_key)
        except Database.DoesNotExist:
            continue
        db_info = settings.DATABASES[database_key]
        if 'postgres' in db_info['ENGINE']:
            db.name = database_key
            db.db_name = db_info['NAME']
            db.username = db_info['USER']
            db.password = db_info['PASSWORD']
            db.host = db_info['HOST']
            db.port = db_info['PORT']
            db.save()


class Migration(migrations.Migration):

    dependencies = [
        ('mathesar', '0005_release_0_1_4'),
    ]
    operations = [
        migrations.RunPython(update_conn_info),
    ]
