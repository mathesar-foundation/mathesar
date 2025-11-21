from uuid import uuid4
from collections import defaultdict

from django.db import transaction

from db.forms import get_tab_col_info_map, form_insert
from db.roles import get_current_role_from_db
from mathesar.models.base import (
    Database, Form, FormField, ConfiguredRole, UserDatabaseRoleMap, ColumnMetaData
)
from mathesar.rpc.columns.metadata import ColumnMetaDataBlob
from mathesar.utils.user_display import get_last_edited_by_columns_for_table


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


def get_table_oid_attnums_map(form_model):
    table_oid_attnums_map = defaultdict(list)
    fields = {field.key: field for field in form_model.fields.all()}
    for field in fields.values():
        if field.column_attnum:
            table_oid = field.parent_field.related_table_oid if field.parent_field else form_model.base_table_oid
            table_oid_attnums_map[table_oid].append(field.column_attnum)
        if field.related_table_oid:
            # Ensure that the table is present even if columns are empty
            table_oid_attnums_map[field.related_table_oid]
    return table_oid_attnums_map


def get_field_tab_col_info_map(form_model):
    table_oid_attnums_map = get_table_oid_attnums_map(form_model)
    with form_model.connection as conn:
        tab_col_info_map = get_tab_col_info_map(table_oid_attnums_map, conn)
    for oid, table_data in tab_col_info_map.items():
        expected_attnums = table_oid_attnums_map[int(oid)]
        column_attnums = table_data["columns"].keys()
        for attn in expected_attnums:
            if str(attn) not in column_attnums:
                table_data["columns"][str(attn)] = {"error": {"code": -31025, "message": f"Column {attn} not found"}}
        metadata_list = (
            ColumnMetaData.objects.filter(attnum__in=column_attnums, table_oid=oid, database=form_model.database)
        )
        for meta in metadata_list:
            col_info = table_data["columns"].get(str(meta.attnum))
            if col_info:
                col_info["metadata"] = ColumnMetaDataBlob.from_model(meta)
    return tab_col_info_map


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
def create_form_fields(form_model, fields_def_list):
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
        ) for field_def, _ in iterate_field_defs(fields_def_list)
    ]
    created_fields = FormField.objects.bulk_create(field_instances)
    created_fields_map = {field.key: field for field in created_fields}
    update_field_instances = []
    for field_def, parent_field_def in iterate_field_defs(fields_def_list):
        if parent_field_def:
            created_field = created_fields_map[field_def["key"]]
            created_field.parent_field = created_fields_map[parent_field_def["key"]]
            update_field_instances.append(created_field)
    if update_field_instances:
        FormField.objects.bulk_update(update_field_instances, ["parent_field"])


@transaction.atomic
def create_form(form_def, user):
    database = Database.objects.get(id=form_def["database_id"])
    associated_role = validate_and_get_associated_role(user, database.id, associated_role_id=form_def.get("associated_role_id"))
    form_model = Form.objects.create(
        token=uuid4(),
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
    create_form_fields(form_model, fields_def_list=form_def["fields"])
    return form_model


def has_permission_for_form(user, form_model):
    if form_model.publish_public:
        return True
    elif user.is_authenticated:
        try:
            # we check whether the user is a collaborator on the database associated with the form.
            UserDatabaseRoleMap.objects.get(user=user, database__id=form_model.database.id)
            return True
        except UserDatabaseRoleMap.DoesNotExist:
            return False
    return False


def get_form(form_token, user):
    form_model = Form.objects.get(token=form_token)
    assert has_permission_for_form(user, form_model), 'Insufficient permission to get the form'
    return form_model


def get_form_source_info(form_token, user):
    form_model = Form.objects.get(token=form_token)
    if form_model:
        assert has_permission_for_form(user, form_model), 'Insufficient permission to get form source info'
        return get_field_tab_col_info_map(form_model)


def list_forms(database_id, schema_oid):
    return Form.objects.filter(database__id=database_id, schema_oid=schema_oid)


def regen_form_token(form_id):
    form_model = Form.objects.get(id=form_id)
    form_model.token = uuid4()
    form_model.save()
    return form_model.token


def set_form_public_setting(form_id, publish_public):
    form_model = Form.objects.get(id=form_id)
    form_model.publish_public = publish_public
    form_model.save()
    return form_model.publish_public


def delete_form(form_id):
    Form.objects.get(id=form_id).delete()


def iterate_form_fields(fields, parent_field=None, depth=0, fields_to_pick=[]):
    """
    Depth-first generator that iterates through the form fields
    """
    for field in fields:
        yield field, parent_field, depth
        if field.key in fields_to_pick:
            # We prune the tree early if the fk interaction for a field is "pick" instead of "create"
            #
            #              A
            #            /   \
            # ("create")B     C("pick")
            #          / \   / \
            #         D   E F   G
            #
            # We don't traverse fields F and G since we know we're going to "pick" a value for C.
            # This has 2 main advantages:
            # - Even if values for F and G are provided by the frontend during submit,
            #   we won't "pick" for C _and_ "create" for F and G, we'll only "pick" for C.
            # - We only send the fields that are required for insert to the db.
            continue
        yield from iterate_form_fields(
            field.child_fields.all(),
            field,
            depth + 1,
            fields_to_pick
        )


def submit_form(form_token, values, user=None):
    """
    Submit a form.

    Args:
        form_token: The unique token of the form.
        values: A dict describing the values to insert.
        user: Optional Django user object. If provided and authenticated,
            user_last_edited_by columns will be set to the user's ID.
            If None or anonymous, these columns will remain unset (NULL).
    """
    form_model = Form.objects.get(token=form_token)
    assert form_model.publish_public, 'This form does not accept submissions'
    fields_to_pick = [i for i in values.keys() if isinstance(values[i], dict) and values[i].get('type') == 'pick']
    field_info_list = [
        {
            "key": field.key,
            "parent_key": parent_field.key if parent_field else None,
            "column_attnum": field.column_attnum,
            "table_oid": parent_field.related_table_oid if parent_field else form_model.base_table_oid,
            "depth": depth
        } for field, parent_field, depth in iterate_form_fields(
            form_model.fields.filter(parent_field__isnull=True),
            fields_to_pick=fields_to_pick
        )
    ]

    # Set user_last_edited_by columns for authenticated users
    # We need to handle this for each table that will be inserted into
    if user and user.is_authenticated and hasattr(user, 'id'):
        # Get unique table OIDs and their minimum depths from field_info_list
        table_depths = {}
        for field_info in field_info_list:
            table_oid = field_info['table_oid']
            depth = field_info['depth']
            if table_oid not in table_depths or depth < table_depths[table_oid]:
                table_depths[table_oid] = depth

        # For each table, add user_last_edited_by columns to field_info_list and values
        for table_oid, depth in table_depths.items():
            last_edited_by_columns = get_last_edited_by_columns_for_table(
                table_oid, form_model.database.id
            )

            for column_attnum in last_edited_by_columns:
                # Check if this column is already in field_info_list
                already_included = any(
                    fi['table_oid'] == table_oid and fi['column_attnum'] == column_attnum
                    for fi in field_info_list
                )

                if not already_included:
                    # Add it to field_info_list with a generated key
                    # Use a key that won't conflict with existing keys
                    key = f"__user_last_edited_by_{table_oid}_{column_attnum}"
                    field_info_list.append({
                        "key": key,
                        "parent_key": None,
                        "column_attnum": column_attnum,
                        "table_oid": table_oid,
                        "depth": depth
                    })

                    # Set the value to the user ID
                    values[key] = user.id

    with form_model.connection as conn:
        form_insert(field_info_list, values, conn)


@transaction.atomic
def patch_form(update_form_def, user):
    form_model = Form.objects.get(id=update_form_def["id"])
    associated_role = validate_and_get_associated_role(
        user,
        database_id=form_model.database.id,
        associated_role_id=update_form_def.get("associated_role_id")
    )
    fields_def_list = update_form_def["fields"]
    if fields_def_list or fields_def_list == []:
        form_model.fields.all().delete()
        create_form_fields(form_model, fields_def_list)
    Form.objects.filter(id=update_form_def["id"]).update(
        name=update_form_def["name"],
        description=update_form_def.get("description"),
        version=update_form_def["version"],
        associated_role=associated_role,
        header_title=update_form_def["header_title"],
        header_subtitle=update_form_def.get("header_subtitle"),
        submit_message=update_form_def.get("submit_message"),
        submit_redirect_url=update_form_def.get("submit_redirect_url"),
        submit_button_label=update_form_def.get("submit_button_label")
    )
    return Form.objects.get(id=update_form_def["id"])
