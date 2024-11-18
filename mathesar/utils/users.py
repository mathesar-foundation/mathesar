from django.db import transaction

from mathesar.models import User


def get_user(user_id):
    return User.objects.get(id=user_id)


def list_users():
    return User.objects.all()


@transaction.atomic
def add_user(user_def):
    user = User.objects.create(
        username=user_def["username"],
        is_superuser=user_def["is_superuser"],
        email=user_def.get("email", ""),
        full_name=user_def.get("full_name", ""),
        short_name=user_def.get("short_name", ""),
        display_language=user_def.get("display_language", "en"),
        password_change_needed=True
    )
    user.set_password(user_def["password"])
    user.save()
    return user


def update_self_user_info(user_id, username, email, full_name, display_language):
    User.objects.filter(id=user_id).update(
        username=username,
        email=email,
        full_name=full_name,
        display_language=display_language
    )
    return get_user(user_id)


def update_other_user_info(user_id, username, is_superuser, email, full_name, display_language):
    User.objects.filter(id=user_id).update(
        username=username,
        is_superuser=is_superuser,
        email=email,
        full_name=full_name,
        display_language=display_language
    )
    return get_user(user_id)


def delete_user(user_id):
    User.objects.get(id=user_id).delete()


def change_password(user_id, new_password):
    user = get_user(user_id)
    user.set_password(new_password)
    user.password_change_needed = False
    user.save()


def revoke_password(user_id, new_password):
    user = get_user(user_id)
    user.set_password(new_password)
    user.password_change_needed = True
    user.save()
