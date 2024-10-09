from abc import ABC, abstractmethod

from mathesar.api.utils import is_valid_uuid_v4
from mathesar.models.users import DatabaseRole, Role, SchemaRole


class AbstractAccessInspector(ABC):
    @abstractmethod
    def __init__(self, user):
        self.user = user

    @abstractmethod
    def is_role_present(self, allowed_roles):
        pass

    def has_role(self, allowed_roles):
        if self.user.is_superuser:
            return True

        if self.user.is_anonymous:
            return False

        return self.is_role_present(allowed_roles)

    def is_atleast_manager(self):
        return self.has_role([Role.MANAGER.value])

    def is_atleast_editor(self):
        allowed_roles = [Role.MANAGER.value, Role.EDITOR.value]
        return self.has_role(allowed_roles)

    def is_atleast_viewer(self):
        allowed_roles = [Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value]
        return self.has_role(allowed_roles)


class DatabaseAccessInspector(AbstractAccessInspector):
    def __init__(self, user, database):
        super().__init__(user)
        self.database = database

    def is_role_present(self, allowed_roles):
        has_db_role = DatabaseRole.objects.filter(
            user=self.user,
            database=self.database,
            role__in=allowed_roles
        ).exists()

        return has_db_role


class SchemaAccessInspector(AbstractAccessInspector):
    def __init__(self, user, schema):
        super().__init__(user)
        self.schema = schema
        self.db_access_inspector = DatabaseAccessInspector(self.user, self.schema.database)

    def is_role_present(self, allowed_roles):
        has_db_role = self.db_access_inspector.has_role(allowed_roles)

        has_schema_role = SchemaRole.objects.filter(
            user=self.user,
            schema=self.schema,
            role__in=allowed_roles
        ).exists()

        return has_db_role or has_schema_role


class TableAccessInspector(AbstractAccessInspector):
    def __init__(self, user, table, token=None):
        super().__init__(user)
        self.table = table
        self.token = token if is_valid_uuid_v4(token) else None
        self.schema_access_inspector = SchemaAccessInspector(self.user, self.table.schema)

    # Currently, there's no access controls on individual tables.
    # If users have access to db or schema, they have access to the tables within them.
    def is_role_present(self, allowed_roles):
        return self.schema_access_inspector.has_role(allowed_roles)

    def is_atleast_viewer(self):
        return super().is_atleast_viewer()
