from uuid import uuid4
from collections import defaultdict

from django.db import transaction

from db.forms import get_oid_col_info_map
from db.roles import get_current_role_from_db
from mathesar.models.base import (
    Form, FormField, ConfiguredRole, UserDatabaseRoleMap, ColumnMetaData
)
from mathesar.rpc.columns.metadata import ColumnMetaDataBlob


def get_submit_role(user, database_id, submit_role_id=None):
    user_dbrm = UserDatabaseRoleMap.objects.get(user=user, database__id=database_id)
    with user_dbrm.connection as conn:
        submit_role = (
            ConfiguredRole.objects.get(id=submit_role_id) if submit_role_id else None
            or user_dbrm.configured_role
        )
        current_role = get_current_role_from_db(conn)
        parent_names = {pr["name"] for pr in current_role["parent_roles"]}
        assert (
            user_dbrm.configured_role == submit_role
            or user_dbrm.user.is_superuser
            or submit_role.name in parent_names
        ), "Insufficient privileges for selected submit_role"
    return submit_role


def get_oid_attnums_map(form_model):
    oam = defaultdict(list)
    fields = {field.key: field for field in form_model.fields.all()}
    for field in fields.values():
        table_oid = field.parent_field.target_table_oid if field.parent_field else form_model.base_table_oid
        oam[table_oid].append(field.attnum)
    return oam


def get_field_col_info_map(form_model):
    oam = get_oid_attnums_map(form_model)
    fields_map = {field.key: field for field in form_model.fields.all()}

    with form_model.connection as conn:
        oid_col_info_map = get_oid_col_info_map(oam, conn)

    metadata_map = {}
    for oid, attnums in oam.items():
        metadata_map[oid] = {
            meta.attnum: ColumnMetaDataBlob.from_model(meta) for meta in ColumnMetaData.objects.filter(attnum__in=attnums, table_oid=oid, database=form_model.database)
        }

    fcim = defaultdict(lambda: {"column": None, "error": None})
    for key, field in fields_map.items():
        try:
            table_oid = field.parent_field.target_table_oid if field.parent_field else form_model.base_table_oid
            fcim[key]["column"] = oid_col_info_map[str(table_oid)][str(field.attnum)] | {'metadata': metadata_map[table_oid].get(field.attnum)}
        except KeyError as e:
            fcim[key]["error"] = {"code": -31025, "message": f"Column {e} not found for field {key}"}
    return fcim


@transaction.atomic
def create_form(form_def, user):
    database_id = form_def["database_id"]
    submit_role = get_submit_role(user, database_id, submit_role_id=form_def.get("submit_role_id"))
    form_model = Form.objects.create(
        token=form_def.get("token", uuid4()),
        name=form_def["name"],
        description=form_def.get("description"),
        version=form_def["version"],
        database_id=database_id,
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
    fields_map = {field.key: field for field in created_fields}
    update_field_instances = []
    for field in form_def["fields"]:
        if field.get("parent_field_key"):
            fields_map[field["key"]].parent_field = fields_map[field["parent_field_key"]]
            update_field_instances.append(fields_map[field["key"]])
    if update_field_instances:
        FormField.objects.bulk_update(update_field_instances, ["parent_field"])
    field_col_info_map = get_field_col_info_map(form_model)
    return form_model, field_col_info_map
