"""
Classes and functions exposed to the RPC endpoint for managing forms.
"""
from typing import Optional, TypedDict

from mathesar.rpc.decorators import mathesar_rpc_method
from mathesar.utils.forms import create_form


class FormInfo(TypedDict):
    @classmethod
    def from_model(cls, model):
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
    pass


@mathesar_rpc_method(name="forms.add", auth="login")
def add(*, form_def: FormDef) -> FormInfo:
    form_model = create_form(form_def)
    return FormInfo.from_model(form_model)
