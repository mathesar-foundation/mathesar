from django.db.models import F

from mathesar.models import User


def get_user_info(user_id):
    return User.objects.get(id=user_id)


def list_user_info():
    return User.objects.all()


def add_user(user_def):
    return User.objects.create(
        username=user_def["username"],
        password=user_def["password"],
        is_superuser=user_def["is_superuser"],
        email=user_def.get("email", ""),
        full_name=user_def.get("full_name", ""),
        short_name=user_def.get("short_name", ""),
        display_language=user_def.get("display_language", "en"),
    )


def update_user_info(user_id, user_info):
    if not get_user_info(user_id).is_superuser:
        user_info.pop("is_superuser")
    User.objects.filter(id=user_id).update(
        username=user_info.get("username", F("username")),
        is_superuser=user_info.get("is_superuser", F("is_superuser")),
        email=user_info.get("email", F("email")),
        full_name=user_info.get("full_name", F("full_name")),
        short_name=user_info.get("short_name", F("short_name")),
        display_language=user_info.get("display_language", F("display_language"))
    )
    return get_user_info(user_id)


def delete_user(user_id):
    User.objects.get(id=user_id).delete()
