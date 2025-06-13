from uuid import uuid4

from django.db import transaction

from db.roles import get_current_role_from_db
from mathesar.models.base import Form, FormField, Database, ConfiguredRole, UserDatabaseRoleMap


@transaction.atomic
def create_form(form_def, user):
    database = Database.objects.get(id=form_def["database_id"])
    user_dbrm = UserDatabaseRoleMap.objects.get(user=user, database=database)
    with user_dbrm.connection as conn:
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
        token=form_def.get("token", uuid4()),
        name=form_def["name"],
        description=form_def.get("description"),
        version=form_def["version"],
        database=database,
        schema_oid=form_def["schema_oid"],
        base_table_oid=form_def["base_table_oid"],
        is_public=form_def.get("is_public", False),
        header_title=form_def["header_title"],
        header_subtitle=form_def.get("header_subtitle"),
        submit_role=submit_role,
        submit_message=form_def.get("submit_message"),
        redirect_url=form_def.get("redirect_url"),
        submit_label=form_def.get("submit_label")
    )
    field_instances = [
        FormField(
            key=field["key"],
            attnum=field["attnum"],
            form=form_model,
            index=field["index"],
            kind=field["kind"],
            label=field.get("label"),
            help=field.get("help"),
            readonly=field.get("readonly", False),
            styling=field.get("styling"),
            is_required=field.get("is_required", False),
            parent_field=None,
            target_table_oid=field.get("target_table_oid"),
            allow_create=field.get("allow_create", False),
            create_label=field.get("create_label")
        ) for field in form_def["fields"]
    ]
    created_fields = FormField.objects.bulk_create(field_instances)
    field_key_model_dict = {field.key: field for field in created_fields}
    update_field_instances = []
    for field in form_def["fields"]:
        if field.get("parent_field_key"):
            field_key_model_dict[field["key"]].parent_field = field_key_model_dict["parent_field_key"]
            update_field_instances.append(field_key_model_dict[field["key"]])
    if update_field_instances:
        FormField.objects.bulk_update(update_field_instances, ["parent_field"])
    return form_model
