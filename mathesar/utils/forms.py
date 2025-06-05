from django.db import transaction

from mathesar.models.base import Form, FormField, Database, ConfiguredRole


@transaction.atomic
def create_form(form_def):
    form_model = Form.objects.create(
        token=form_def["token"],
        name=form_def["name"],
        description=form_def.get("description"),
        version=form_def["version"],
        database=Database.objects.get(id=form_def["database_id"]),
        schema_oid=form_def["schema_oid"],
        base_table_oid=form_def["base_table_oid"],
        is_public=form_def.get("is_public"),
        header_title=form_def["header_title"],
        header_subtitle=form_def.get("header_subtitle"),
        submit_role=ConfiguredRole.objects.get(id=form_def.get("submit_role_id")) if
        len(ConfiguredRole.objects.filter(id=form_def.get("submit_role_id"))) else None,
        submit_message=form_def.get("submit_message"),
        redirect_url=form_def.get("redirect_url"),
        submit_label=form_def.get("submit_label")
    )
    for field in form_def["fields"]:
        FormField.objects.create(
            key=field["key"],
            attnum=field["attnum"],
            form=form_model,
            order=field["order"],
            kind=field["kind"],
            label=field.get("label"),
            help=field.get("help"),
            readonly=field.get("readonly"),
            styling=field.get("styling"),
            is_required=field.get("is_required"),
            parent_field=FormField.objects.get(key=field["key"], form=form_model) if
            len(FormField.objects.filter(key=field["key"], form=form_model)) else None,
            target_table_oid=field.get("target_table_oid"),
            allow_create=field.get("allow_create"),
            create_label=field.get("create_label")
        )
