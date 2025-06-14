"""
Classes and functions exposed to the RPC endpoint for managing forms.
"""
from typing import Optional, TypedDict, Literal

from modernrpc.core import REQUEST_KEY

from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.utils.forms import create_form


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
        label: ???
        help: ???
        readonly: Specifies whether the selected field is readonly.
        styling: ???
        is_required: Specifies whether a value for the field is mandatory.
        parent_field_id: The Django id of the Field set as parent for related fields.
        target_table_oid: The OID of the related table.
        allow_create: Specifies whether adding new records is allowed within related fields.
        create_label: ???
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


class FormInfo(TypedDict):
    """
    Information about a form.

    Attributes:
        id: The Django id of the Form on the database.
        created_at: The time at which the form model got created.
        updated_at: The time at which the form model was last updated.
        token: A UUIDv4 object used to identify a form uniquely.
        name: The name of the form.
        description: The desciription of the form.
        version: The version of the form.
        database_id: The Django id of the database containing the Form.
        schema_oid: The OID of the schema where within which form exists.
        base_table_oid: The table OID based on which a form will be created.
        is_public: Specifies wheather the form is publically accessible.
        header_title: The Django id of the configured role to be used while submitting a form.
        header_subtitle: ???
        submit_role_id: ???
        submit_message: Message to be displayed upon submission.
        redirect_url: Redirect path after submission.
        submit_label: Text to be displayed on the submit button.
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
    is_public: bool
    header_title: dict
    header_subtitle: Optional[dict]
    submit_role_id: Optional[int]
    submit_message: Optional[dict]
    redirect_url: Optional[str]
    submit_label: Optional[str]
    fields: Optional[list[FieldInfo]]

    @classmethod
    def from_model(cls, form_model):
        def rm_keys(model, keys):
            return {k: v for k, v in model.__dict__.items() if k not in keys}
        return {**rm_keys(form_model, ('_state')), "fields": [rm_keys(f, ('_state', 'created_at', 'updated_at')) for f in form_model.fields.all()]}


class FieldDef(TypedDict):
    """
    Definition needed to add/modify a form field.

    Attributes:
        key: A unique string identifier for the field within a form.
        attnum: The attnum of column to be selected as a field.
        index: The order in which the field should be displayed.
        kind: Type of the selected column(scalar_column, foreign_key, reverse_foreign_key)
        label: ???
        help: ???
        readonly: Specifies whether the selected field is readonly.
        styling: ???
        is_required: Specifies whether a value for the field is mandatory.
        parent_field_key: Field key to specify parent field for foreign_key or reverse_foreign_key.
        target_table_oid: The OID of the related table.
        allow_create: Specifies whether adding new records is allowed within related fields.
        create_label: ???
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
        description: The desciription of the form.
        version: The version of the form.
        database_id: The Django id of the database containing the Form.
        schema_oid: The OID of the schema where within which form exists.
        base_table_oid: The table OID based on which a form will be created.
        is_public: Specifies wheather the form is publically accessible.
        header_title: ???
        header_subtitle: ???
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
    form_model = create_form(form_def, user)
    return FormInfo.from_model(form_model)
