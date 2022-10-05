from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from mathesar.models.base import Table, Schema, DataFile
from mathesar.models.users import User


admin.site.register(Table)
admin.site.register(Schema)
admin.site.register(DataFile)
admin.site.register(User, UserAdmin)
