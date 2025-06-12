from django.db import transaction

from db.roles import get_current_role_from_db
from mathesar.models.base import Form, FormField, Database, ConfiguredRole, UserDatabaseRoleMap


@transaction.atomic
def create_form(form_def, user):
    database = Database.objects.get(id=form_def["database_id"])
    user_dbrm = UserDatabaseRoleMap.objects.get(user=user, database=database)
    with user_dbrm.connection() as conn:
        submit_role = (
            ConfiguredRole.objects.filter(id=form_def.get("submit_role_id")).first()
            or user_dbrm.configured_role
        )
        current_role = get_current_role_from_db(conn)
        parent_names = {pr["name"] for pr in current_role["parent_roles"]}
        assert (
            user_dbrm.configured_role == submit_role
            or user.is_superuser
            or submit_role.name in parent_names
        ), "Insufficient Privileges for selected submit_role"
    form_model = Form.objects.create(
        token=form_def["token"],
        name=form_def["name"],
        description=form_def.get("description"),
        version=form_def["version"],
        database=database,
        schema_oid=form_def["schema_oid"],
        base_table_oid=form_def["base_table_oid"],
        is_public=form_def.get("is_public"),
        header_title=form_def["header_title"],
        header_subtitle=form_def.get("header_subtitle"),
        submit_role=submit_role,
        submit_message=form_def.get("submit_message"),
        redirect_url=form_def.get("redirect_url"),
        submit_label=form_def.get("submit_label")
    )
    field_models = []
    for field in form_def["fields"]:
        # TODO: consider bulk_create
        field_model = FormField.objects.create(
            key=field["key"],
            attnum=field["attnum"],
            form=form_model,
            index=field["index"],
            kind=field["kind"],
            label=field.get("label"),
            help=field.get("help"),
            readonly=field.get("readonly"),
            styling=field.get("styling"),
            is_required=field.get("is_required"),
            parent_field=FormField.objects.get(key=field.get("parent_field_key"), form=form_model) if
            len(FormField.objects.filter(key=field.get("parent_field_key"), form=form_model)) else None,
            target_table_oid=field.get("target_table_oid"),
            allow_create=field.get("allow_create"),
            create_label=field.get("create_label")
        )
        field_models.append(field_model)
    return form_model, tuple(field_models)
