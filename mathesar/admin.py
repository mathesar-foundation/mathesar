from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from mathesar.models.deprecated import Table, Schema, DataFile
from mathesar.models.users import User
from mathesar.models.query import Exploration
from mathesar.models.shares import SharedTable, SharedQuery


class MathesarUserAdmin(UserAdmin):
    model = User

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('full_name', 'short_name', 'email',)}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )


admin.site.register(Table)
admin.site.register(Schema)
admin.site.register(DataFile)
admin.site.register(User, MathesarUserAdmin)
admin.site.register(Exploration)
admin.site.register(SharedTable)
admin.site.register(SharedQuery)
