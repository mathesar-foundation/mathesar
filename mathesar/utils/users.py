from django.db.models import F

from mathesar.models import User


def get_user(user_id):
    return User.objects.get(id=user_id)


def list_users():
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


def update_user_info(user_id, user_info, requesting_user):
    if not requesting_user.is_superuser:
        user_info.pop("is_superuser", None)
    User.objects.filter(id=user_id).update(
        username=user_info.get("username", F("username")),
        is_superuser=user_info.get("is_superuser", F("is_superuser")),
        email=user_info.get("email", F("email")),
        full_name=user_info.get("full_name", F("full_name")),
        short_name=user_info.get("short_name", F("short_name")),
        display_language=user_info.get("display_language", F("display_language"))
    )
    return get_user(user_id)


def delete_user(user_id):
    User.objects.get(id=user_id).delete()


def change_password(user_id, old_password, new_password):
    user = get_user(user_id)
    if not user.check_password(old_password):
        raise Exception('Old password is not correct')
    user.set_password(new_password)
    user.password_change_needed = False
    user.save()


def revoke_password(user_id, new_password):
    user = get_user(user_id)
    user.set_password(new_password)
    user.password_change_needed = True
    user.save()
