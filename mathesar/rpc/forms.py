"""
Classes and functions exposed to the RPC endpoint for managing forms.
"""
from typing import Optional, TypedDict

from modernrpc.core import REQUEST_KEY

from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.utils.forms import create_form


class FormInfo(TypedDict):
    @classmethod
    def from_model(cls, form_model, field_models):
        pass
    pass


class FieldDef(TypedDict):
    key: str
    attnum: int
    index: int
    kind: str
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
    token: str
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
    user = kwargs.get(REQUEST_KEY).user
    form_model, field_models = create_form(form_def, user)
    return FormInfo.from_model(form_model, field_models)
