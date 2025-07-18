from uuid import uuid4

from django.db import transaction

from db.roles import get_current_role_from_db
from mathesar.models.base import (
    Database, Form, FormField, ConfiguredRole, UserDatabaseRoleMap
)


def validate_and_get_associated_role(user, database_id, associated_role_id=None):
    user_dbrm = UserDatabaseRoleMap.objects.get(user=user, database__id=database_id)
    with user_dbrm.connection as conn:
        associated_role = (
            ConfiguredRole.objects.get(id=associated_role_id) if associated_role_id else None
            or user_dbrm.configured_role
        )
        current_role = get_current_role_from_db(conn)
        parent_names = {pr["name"] for pr in current_role["parent_roles"]}
        assert (
            user_dbrm.configured_role == associated_role
            or user_dbrm.user.is_superuser
            or associated_role.name in parent_names
        ), "Insufficient privileges for selected associated_role"
    return associated_role


def iterate_field_defs(field_defs, parent_field_defn=None):
    """
    Depth-first generator that iterates through the field definitions
    """
    for fdef in field_defs:
        yield fdef, parent_field_defn
        yield from iterate_field_defs(
            fdef.get("child_fields", []),
            fdef
        )


@transaction.atomic
def create_form(form_def, user):
    database = Database.objects.get(id=form_def["database_id"])
    associated_role = validate_and_get_associated_role(user, database.id, associated_role_id=form_def.get("associated_role_id"))
    form_model = Form.objects.create(
        **({"id": form_def["id"]} if form_def.get("id") else {}),  # we get an id during replace
        token=form_def.get("token", uuid4()),
        name=form_def["name"],
        description=form_def.get("description"),
        version=form_def["version"],
        database=database,
        server=database.server,
        schema_oid=form_def["schema_oid"],
        base_table_oid=form_def["base_table_oid"],
        associated_role=associated_role,
        header_title=form_def["header_title"],
        header_subtitle=form_def.get("header_subtitle"),
        submit_message=form_def.get("submit_message"),
        submit_redirect_url=form_def.get("submit_redirect_url"),
        submit_button_label=form_def.get("submit_button_label")
    )
    field_instances = [
        FormField(
            key=field_def["key"],
            form=form_model,
            index=field_def["index"],
            label=field_def.get("label"),
            help=field_def.get("help"),
            kind=field_def["kind"],
            column_attnum=field_def.get("column_attnum"),
            related_table_oid=field_def.get("related_table_oid"),
            fk_interaction_rule=field_def.get("fk_interaction_rule"),
            parent_field=None,
            styling=field_def.get("styling"),
            is_required=field_def.get("is_required", False),
        ) for field_def, _parent in iterate_field_defs(form_def["fields"])
    ]
    created_fields = FormField.objects.bulk_create(field_instances)
    created_fields_map = {field.key: field for field in created_fields}
    update_field_instances = []
    for field_def, parent_field_def in iterate_field_defs(form_def["fields"]):
        if parent_field_def:
            created_field = created_fields_map[field_def["key"]]
            created_field.parent_field = created_fields_map[parent_field_def["key"]]
            update_field_instances.append(created_field)
    if update_field_instances:
        FormField.objects.bulk_update(update_field_instances, ["parent_field"])
    return form_model


def get_form(form_id):
    form_model = Form.objects.get(id=form_id)
    return form_model


def list_forms(database_id, schema_oid):
    return Form.objects.filter(database__id=database_id, schema_oid=schema_oid)


def delete_form(form_id):
    Form.objects.get(id=form_id).delete()


@transaction.atomic
def replace_form(form_def_with_id, user):
    Form.objects.get(id=form_def_with_id["id"]).delete()
    form_model = create_form(form_def_with_id, user)
    return form_model
