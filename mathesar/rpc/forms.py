"""
Classes and functions exposed to the RPC endpoint for managing forms.
"""
from typing import Optional, TypedDict, Literal

from modernrpc.core import REQUEST_KEY

from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.utils.forms import create_form, get_form, list_forms, delete_form, replace_form, get_form_source_info


class FieldInfo(TypedDict):
    """
    Information about a form field.

    Attributes:
        id: The Django id of the Field on the database.
        key: A unique string identifier for the field within a form.
        form_id: The Django id of the Form on the database.
        index: The order in which the field should be displayed.
        label: The text to be displayed for the field input.
        help: The help text to be displayed for the field input.
        kind: Type of the selected column (scalar_column, foreign_key).
        column_attnum: The attnum of column to be selected as a field. Applicable for scalar_column and foreign_key fields.
        related_table_oid: The oid of the related table. Applicable for foreign_key fields.
        fk_interaction_rule: Determines user interaction with a foreign_key field's related record (must_pick, can_pick_or_create, must_create).
        parent_field_id: The Django id of the Field set as parent for related fields.
        styling: Information about the visual appearance of the field.
        is_required: Specifies whether a value for the field is mandatory.
        child_fields: List of definitions of child fields. Applicable for foreign_key fields.
    """
    id: int
    key: str
    form_id: int
    index: int
    label: Optional[str]
    help: Optional[str]
    kind: Literal["scalar_column", "foreign_key"]
    column_attnum: Optional[int]
    related_table_oid: Optional[int]
    fk_interaction_rule: Literal["must_pick", "can_pick_or_create", "must_create"]
    styling: Optional[dict]
    is_required: bool
    child_fields: Optional[list["FieldInfo"]]

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            key=model.key,
            form_id=model.form_id,
            index=model.index,
            label=model.label,
            help=model.help,
            kind=model.kind,
            column_attnum=model.column_attnum,
            related_table_oid=model.related_table_oid,
            fk_interaction_rule=model.fk_interaction_rule,
            styling=model.styling,
            is_required=model.is_required,
            child_fields=[FieldInfo.from_model(field) for field in model.child_fields.all()] if model.child_fields else None,
        )


class FormInfo(TypedDict):
    """
    Information about a form.

    Attributes:
        id: The Django id of the Form on the database.
        created_at: The time at which the form model got created.
        updated_at: The time at which the form model was last updated.
        token: A UUIDv4 object used to identify a form uniquely.
        name: The name of the form.
        description: The description of the form.
        version: The version of the form for reconciliation of json fields.
        database_id: The Django id of the database containing the Form.
        schema_oid: The OID of the schema where within which form exists.
        base_table_oid: The table OID based on which a form will be created.
        associated_role_id: The Django id of the configured role to be used while submitting a form.
        header_title: The title of the rendered form.
        header_subtitle: The subtitle of the rendered form.
        publish_public: Specifies whether the form is publicly accessible.
        submit_message: Message to be displayed upon submission.
        submit_redirect_url: Redirect path after submission.
        submit_button_label: Text to be displayed on the submit button.
        fields: Definition of Fields within the form.
    """
    id: int
    created_at: str
    updated_at: str
    token: str
    name: str
    description: Optional[str]
    version: int
    database_id: int
    schema_oid: int
    base_table_oid: int
    associated_role_id: Optional[int]
    header_title: dict
    header_subtitle: Optional[dict]
    publish_public: bool
    submit_message: Optional[dict]
    submit_redirect_url: Optional[str]
    submit_button_label: Optional[str]
    fields: list[FieldInfo]

    @classmethod
    def from_model(cls, form_model):
        return cls(
            id=form_model.id,
            created_at=form_model.created_at,
            updated_at=form_model.updated_at,
            token=form_model.token,
            name=form_model.name,
            description=form_model.description,
            version=form_model.version,
            database_id=form_model.database_id,
            schema_oid=form_model.schema_oid,
            base_table_oid=form_model.base_table_oid,
            associated_role_id=form_model.associated_role_id,
            header_title=form_model.header_title,
            header_subtitle=form_model.header_subtitle,
            publish_public=form_model.publish_public,
            submit_message=form_model.submit_message,
            submit_redirect_url=form_model.submit_redirect_url,
            submit_button_label=form_model.submit_button_label,
            fields=[FieldInfo.from_model(field) for field in form_model.fields.filter(parent_field__isnull=True)],
        )


class AddOrReplaceFieldDef(TypedDict):
    """
    FormField definition needed while adding or replacing a form.

    Attributes:
        key: A unique string identifier for the field within a form.
        index: The order in which the field should be displayed.
        label: The text to be displayed for the field input.
        help: The help text to be displayed for the field input.
        kind: Type of the selected column (scalar_column, foreign_key).
        column_attnum: The attnum of column to be selected as a field. Applicable for scalar_column and foreign_key fields.
        related_table_oid: The oid of the related table. Applicable for foreign_key fields.
        fk_interaction_rule: Determines user interaction with a foreign_key field's related record (must_pick, can_pick_or_create, must_create).
        styling: Information about the visual appearance of the field.
        is_required: Specifies whether a value for the field is mandatory.
        child_fields: List of definitions of child fields. Applicable for foreign_key fields.
    """
    key: str
    index: int
    label: Optional[str]
    help: Optional[str]
    kind: Literal["scalar_column", "foreign_key"]
    column_attnum: Optional[int]
    related_table_oid: Optional[int]
    fk_interaction_rule: Literal["must_pick", "can_pick_or_create", "must_create"]
    styling: Optional[dict]
    is_required: Optional[bool]
    child_fields: Optional[list["AddOrReplaceFieldDef"]]


class AddFormDef(TypedDict):
    """
    Definition needed to add a form.

    Attributes:
        token: A UUIDv4 object used to identify a form uniquely.
        name: The name of the form.
        description: The description of the form.
        version: The version of the form for reconciliation of json fields.
        database_id: The Django id of the database containing the Form.
        schema_oid: The OID of the schema where within which form exists.
        base_table_oid: The table OID based on which a form will be created.
        associated_role_id: The Django id of the configured role to be used while submitting a form.
        header_title: The title of the rendered form.
        header_subtitle: The subtitle of the rendered form.
        submit_message: Message to be displayed upon submission.
        submit_redirect_url: Redirect path after submission.
        submit_button_label: Text to be displayed on the submit button.
        fields: Definition of Fields within the form.
    """
    token: Optional[str]
    name: str
    description: Optional[str]
    version: int
    database_id: int
    schema_oid: int
    base_table_oid: int
    associated_role_id: Optional[int]
    header_title: dict
    header_subtitle: Optional[dict]
    submit_message: Optional[dict]
    submit_redirect_url: Optional[str]
    submit_button_label: Optional[str]
    fields: list[AddOrReplaceFieldDef]


class ReplaceableFormDef(AddFormDef):
    """
    Definition needed to replace a form.

    Attributes:
        id: The Django id of the Form on the database.
        token: A UUIDv4 object used to identify a form uniquely.
        name: The name of the form.
        description: The description of the form.
        version: The version of the form.
        database_id: The Django id of the database containing the Form.
        schema_oid: The OID of the schema where within which form exists.
        base_table_oid: The table OID based on which a form will be created.
        is_public: Specifies whether the form is publicly accessible.
        header_title: The title of the rendered form.
        header_subtitle: The subtitle of the rendered form.
        submit_role_id: The Django id of the configured role to be used while submitting a form.
        submit_message: Message to be displayed upon submission.
        redirect_url: Redirect path after submission.
        submit_label: Text to be displayed on the submit button.
        fields: Definition of Fields within the form.
    """
    id: int


@mathesar_rpc_method(name="forms.add", auth="login")
def add(*, form_def: AddFormDef, **kwargs) -> FormInfo:
    """
    Add a new form.

    Args:
        form_def: A dict describing the form to create.

    Returns:
        The details for the newly created form.
    """
    user = kwargs.get(REQUEST_KEY).user
    form_model = create_form(form_def, user)
    return FormInfo.from_model(form_model)


@mathesar_rpc_method(name="forms.get", auth="anonymous")
def get(*, form_id: int, **kwargs) -> FormInfo:
    """
    List information about a form.

    Args:
        form_id: The Django id of the form.

    Returns:
        Form details for a given form_id.
    """
    form_model = get_form(form_id)
    return FormInfo.from_model(form_model)


@mathesar_rpc_method(name="forms.get_source_info", auth="anonymous")
def get_source_info(*, form_token: str, **kwargs) -> FormInfo:
    """
    Retrieve the sources of a form.

    Args:
        form_token: The unique token of the form.

    Returns:
        The source tables & columns of the form:
            - Tables associated with the form.
            - Columns of the fields associated with the form.
    """
    form_source_info = get_form_source_info(form_token)
    return form_source_info


@mathesar_rpc_method(name="forms.list", auth="login")
def list_(*, database_id: int, schema_oid: int, **kwargs) -> FormInfo:
    """
    List information about forms for a database. Exposed as `list`.

    Args:
        database_id: The Django id of the database containing the form.
        schema_oid: The OID of the schema containing the base table(s) of the forms(s).

    Returns:
        A list of form info.
    """
    forms = list_forms(database_id, schema_oid)
    return [FormInfo.from_model(form) for form in forms]


@mathesar_rpc_method(name="forms.delete", auth="login")
def delete(*, form_id: int, **kwargs) -> None:
    """
    Delete a form.

    Args:
        form_id: The Django id of the form to delete.
    """
    delete_form(form_id)


@mathesar_rpc_method(name="forms.replace", auth="login")
def replace(*, new_form: ReplaceableFormDef, **kwargs) -> FormInfo:
    """
    Replace a form.

    Args:
        new_form: A dict describing the form to replace, including the updated fields.

    Returns:
        The form info for the replaced form.
    """
    user = kwargs.get(REQUEST_KEY).user
    form_model = replace_form(new_form, user)
    return FormInfo.from_model(form_model)
