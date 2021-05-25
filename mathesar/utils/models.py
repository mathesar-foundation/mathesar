import os


def user_directory_path(instance, filename):
    user_identifier = instance.user.username if instance.user else 'anonymous'
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return os.path.join(user_identifier, filename)
