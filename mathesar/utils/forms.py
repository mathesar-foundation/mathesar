from uuid import uuid4
from collections import defaultdict

from django.db import transaction

from db.forms import get_info_for_table_col_cons_map
from db.roles import get_current_role_from_db
from mathesar.models.base import (
    Database, Form, FormField, ConfiguredRole, UserDatabaseRoleMap, ColumnMetaData
)
from mathesar.rpc.columns.metadata import ColumnMetaDataBlob


def validate_and_get_access_role(user, database_id, access_role_id=None):
    user_dbrm = UserDatabaseRoleMap.objects.get(user=user, database__id=database_id)
    with user_dbrm.connection as conn:
        access_role = (
            ConfiguredRole.objects.get(id=access_role_id) if access_role_id else None
            or user_dbrm.configured_role
        )
        current_role = get_current_role_from_db(conn)
        parent_names = {pr["name"] for pr in current_role["parent_roles"]}
        assert (
            user_dbrm.configured_role == access_role
            or user_dbrm.user.is_superuser
            or access_role.name in parent_names
        ), "Insufficient privileges for selected access_role"
    return access_role


def get_table_oid_attnums_cons_map(form_model):
    table_oid_attnums_map = defaultdict(list)
    constraints_oids = []

    fields = {field.key: field for field in form_model.fields.all()}
    for field in fields.values():
        if field.column_attnum:
            table_oid = field.parent_field.related_table_oid if field.parent_field else form_model.base_table_oid
            table_oid_attnums_map[table_oid].append(field.column_attnum)

        if field.related_table_oid:
            # Ensure that the table is present even if columns are empty
            table_oid_attnums_map[field.related_table_oid]

        if field.constraint_oid:
            constraints_oids.append(field.constraint_oid)

    return {
        "tables": table_oid_attnums_map,
        "constraints": constraints_oids
    }


def get_field_table_col_cons_info_map(form_model):
    table_oid_attnums_cons_map = get_table_oid_attnums_cons_map(form_model)

    with form_model.connection as conn:
        table_oid_attnums_cons_info_map = get_info_for_table_col_cons_map(table_oid_attnums_cons_map, conn)

    for oid, table_data in table_oid_attnums_cons_info_map["tables"].items():
        column_attnums = table_data["columns"].keys()
        metadata_list = (
            ColumnMetaData.objects.filter(attnum__in=column_attnums, table_oid=oid, database=form_model.database)
        )
        for meta in metadata_list:
            col_info = table_data["columns"].get(meta.attnum)
            if col_info:
                col_info["metadata"] = ColumnMetaDataBlob.from_model(meta)

    return table_oid_attnums_cons_info_map


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


def construct_form_field_model_from_defn(field_def, form_model, parent_field=None):
    return FormField(
        key=field_def["key"],
        form=form_model,
        index=field_def["index"],
        label=field_def.get("label"),
        help=field_def.get("help"),
        kind=field_def["kind"],
        column_attnum=field_def.get("column_attnum"),
        constraint_oid=field_def.get("constraint_oid"),
        related_table_oid=field_def.get("related_table_oid"),
        fk_interaction_rule=field_def.get("fk_interaction_rule"),
        parent_field=parent_field,
        styling=field_def.get("styling"),
        is_required=field_def.get("is_required", False),
    )


@transaction.atomic
def create_form(form_def, user):
    database = Database.objects.get(id=form_def["database_id"])
    access_role = validate_and_get_access_role(user, database.id, access_role_id=form_def.get("access_role_id"))
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
        access_role=access_role,
        header_title=form_def["header_title"],
        header_subtitle=form_def.get("header_subtitle"),
        submit_message=form_def.get("submit_message"),
        submit_redirect_url=form_def.get("submit_redirect_url"),
        submit_button_label=form_def.get("submit_button_label")
    )
    field_instances = [
        construct_form_field_model_from_defn(
            field_def,
            form_model,
            None
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
    field_col_info_map = get_field_table_col_cons_info_map(form_model)
    return form_model, field_col_info_map


def get_form(form_id):
    form_model = Form.objects.get(id=form_id)
    field_col_info_map = get_field_table_col_cons_info_map(form_model)
    return form_model, field_col_info_map


def list_forms(database_id, schema_oid):
    return Form.objects.filter(database__id=database_id, schema_oid=schema_oid)


def delete_form(form_id):
    Form.objects.get(id=form_id).delete()


@transaction.atomic
def replace_form(form_def_with_id, user):
    Form.objects.get(id=form_def_with_id["id"]).delete()
    form_model, field_col_info_map = create_form(form_def_with_id, user)
    return form_model, field_col_info_map
