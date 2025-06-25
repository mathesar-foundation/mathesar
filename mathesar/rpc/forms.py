"""
Classes and functions exposed to the RPC endpoint for managing forms.
"""
from typing import Optional, TypedDict, Literal

from modernrpc.core import REQUEST_KEY

from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.utils.forms import create_form, get_form, get_public_form, list_forms, delete_form


class FieldInfo(TypedDict):
    """
    Information about a form field.

    Attributes:
        id: The Django id of the Field on the database.
        key: A unique string identifier for the field within a form.
        attnum: The attnum of column to be selected as a field.
        form_id: The Django id of the Form on the database.
        index: The order in which the field should be displayed.
        kind: Type of the selected column(scalar_column, foreign_key, reverse_foreign_key)
        label: The text to be displayed within the field.
        help: The help text to be displayed for a field.
        readonly: Specifies whether the selected field is readonly.
        styling: Information about the visual appearance of the field.
        is_required: Specifies whether a value for the field is mandatory.
        parent_field_id: The Django id of the Field set as parent for related fields.
        target_table_oid: The OID of the related table.
        allow_create: Specifies whether adding new records is allowed within related fields.
        create_label: The label to be shown while inserting a new related record.
    """
    id: int
    key: str
    attnum: int
    form_id: int
    index: int
    kind: Literal["scalar_column", "foreign_key", "reverse_foreign_key"]
    label: Optional[str]
    help: Optional[str]
    readonly: bool
    styling: Optional[dict]
    is_required: bool
    parent_field_id: Optional[int]
    target_table_oid: Optional[int]
    allow_create: bool
    create_label: Optional[str]

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            key=model.key,
            attnum=model.attnum,
            form_id=model.form_id,
            index=model.index,
            kind=model.kind,
            label=model.label,
            help=model.help,
            readonly=model.readonly,
            styling=model.styling,
            is_required=model.is_required,
            parent_field_id=model.parent_field_id,
            target_table_oid=model.target_table_oid,
            allow_create=model.allow_create,
            create_label=model.create_label
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
        field_col_info_map: A map between field_keys and column info with metadata.
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
    is_public: bool
    header_title: dict
    header_subtitle: Optional[dict]
    submit_role_id: Optional[int]
    submit_message: Optional[dict]
    redirect_url: Optional[str]
    submit_label: Optional[str]
    fields: Optional[list[FieldInfo]]
    field_col_info_map: Optional[dict]

    @classmethod
    def from_model(cls, form_model, field_col_info_map=None):
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
            is_public=form_model.is_public,
            header_title=form_model.header_title,
            header_subtitle=form_model.header_subtitle,
            submit_role_id=form_model.submit_role_id,
            submit_message=form_model.submit_message,
            redirect_url=form_model.redirect_url,
            submit_label=form_model.submit_label,
            fields=[FieldInfo.from_model(field) for field in form_model.fields.all()],
            field_col_info_map=field_col_info_map
        )


class PublicFormInfo(TypedDict):
    """
    Information about a public form.

    Attributes:
        id: The Django id of the Form on the database.
        created_at: The time at which the form model got created.
        updated_at: The time at which the form model was last updated.
        token: A UUIDv4 object used to identify a form uniquely.
        name: The name of the form.
        description: The description of the form.
        version: The version of the form.
        database_id: The Django id of the database containing the Form.
        schema_oid: The OID of the schema where within which form exists.
        base_table_oid: The table OID based on which a form will be created.
        header_title: The title of the rendered form.
        header_subtitle: The subtitle of the rendered form.
        submit_message: Message to be displayed upon submission.
        redirect_url: Redirect path after submission.
        submit_label: Text to be displayed on the submit button.
        fields: Definition of Fields within the form.
        field_col_info_map: A map between field_keys and column info with metadata.
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
    header_title: dict
    header_subtitle: Optional[dict]
    submit_message: Optional[dict]
    redirect_url: Optional[str]
    submit_label: Optional[str]
    fields: Optional[list[FieldInfo]]
    field_col_info_map: Optional[dict]

    @classmethod
    def from_model(cls, form_model, field_col_info_map=None):
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
            header_title=form_model.header_title,
            header_subtitle=form_model.header_subtitle,
            submit_message=form_model.submit_message,
            redirect_url=form_model.redirect_url,
            submit_label=form_model.submit_label,
            fields=[FieldInfo.from_model(field) for field in form_model.fields.all()],
            field_col_info_map=field_col_info_map
        )


class FieldDef(TypedDict):
    """
    Definition needed to add/modify a form field.

    Attributes:
        key: A unique string identifier for the field within a form.
        attnum: The attnum of column to be selected as a field.
        index: The order in which the field should be displayed.
        kind: Type of the selected column(scalar_column, foreign_key, reverse_foreign_key)
        label: The text to be displayed within the field.
        help: The help text to be displayed for a field.
        readonly: Specifies whether the selected field is readonly.
        styling: Information about the visual appearance of the field.
        is_required: Specifies whether a value for the field is mandatory.
        parent_field_key: Field key to specify parent field for foreign_key or reverse_foreign_key.
        target_table_oid: The OID of the related table.
        allow_create: Specifies whether adding new records is allowed within related fields.
        create_label: The label to be shown while inserting a new related record.
    """
    key: str
    attnum: int
    index: int
    kind: Literal["scalar_column", "foreign_key", "reverse_foreign_key"]
    label: Optional[str]
    help: Optional[str]
    readonly: Optional[bool]
    styling: Optional[dict]
    is_required: Optional[bool]
    parent_field_key: Optional[str]
    target_table_oid: Optional[int]
    allow_create: Optional[bool]
    create_label: Optional[str]


class FormDef(TypedDict):
    """
    Definition needed to add/modify a form.

    Attributes:
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
    token: Optional[str]
    name: str
    description: Optional[str]
    version: int
    database_id: int
    schema_oid: int
    base_table_oid: int
    is_public: Optional[bool]
    header_title: dict
    header_subtitle: Optional[dict]
    submit_role_id: Optional[int]
    submit_message: Optional[dict]
    redirect_url: Optional[str]
    submit_label: Optional[str]
    fields: Optional[list[FieldDef]]


@mathesar_rpc_method(name="forms.add", auth="login")
def add(*, form_def: FormDef, **kwargs) -> FormInfo:
    """
    Add a new form.

    Args:
        form_def: A dict describing the form to create.

    Returns:
        The details for the newly created form.
    """
    user = kwargs.get(REQUEST_KEY).user
    form_model, field_col_info_map = create_form(form_def, user)
    return FormInfo.from_model(form_model, field_col_info_map)


@mathesar_rpc_method(name="forms.get", auth="login")
def get(*, form_id: int, **kwargs) -> FormInfo:
    """
    List information about a form.

    Args:
        form_id: The Django id of the form.

    Returns:
        Form details for a given form_id.
    """
    form_model, field_col_info_map = get_form(form_id)
    return FormInfo.from_model(form_model, field_col_info_map)


@mathesar_rpc_method(name="forms.get_public", auth="anonymous")
def get_public(*, form_id: int, **kwargs) -> PublicFormInfo:
    """
    List information about a public form.

    Args:
        form_id: The Django id of the public form.

    Returns:
        Public form details for a given form_id.
    """
    form_model, field_col_info_map = get_public_form(form_id)
    return PublicFormInfo.from_model(form_model, field_col_info_map)


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
