"""
This file tests the forms RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from unittest.mock import MagicMock, PropertyMock

from mathesar.rpc import forms
from mathesar.models.users import User
from mathesar.models.base import Form, FormField


test_data_form1 = {
    'form': Form(
        id=42,
        created_at="2025-06-13T23:18:05.108Z",
        updated_at="2025-06-13T23:18:05.108Z",
        token="db1bbb54-58df-4d5b-9909-a8b856f5a804",
        name="form1",
        description=None,
        version=1,
        database_id=1,
        server_id=1,
        schema_oid=18145,
        base_table_oid=18152,
        associated_role_id=121,
        header_title={"title": "text"},
        header_subtitle=None,
        publish_public=False,
        submit_message=None,
        submit_redirect_url=None,
        submit_button_label=None,
    ),
    'fields': [
        FormField(
            id=70,
            key="k1",
            form_id=42,
            index=1,
            label="Authors",
            help=None,
            kind="foreign_key",
            column_attnum=10,
            related_table_oid=18146,
            fk_interaction_rule="can_pick_or_create",
            parent_field_id=None,
            styling=None,
            is_required=False
        ),
        FormField(
            id=71,
            key="k2",
            form_id=42,
            index=2,
            label="First Name",
            help=None,
            kind="scalar_column",
            column_attnum=2,
            related_table_oid=None,
            fk_interaction_rule=None,
            parent_field_id=70,
            styling=None,
            is_required=False
        ),
        FormField(
            id=72,
            key="k3",
            form_id=42,
            index=3,
            label="Last Name",
            help=None,
            kind="scalar_column",
            column_attnum=3,
            related_table_oid=None,
            fk_interaction_rule=None,
            parent_field_id=70,
            styling=None,
            is_required=False
        )
    ],
    'expected_form_info': {
        "id": 42,
        "created_at": "2025-06-13T23:18:05.108Z",
        "updated_at": "2025-06-13T23:18:05.108Z",
        "token": "db1bbb54-58df-4d5b-9909-a8b856f5a804",
        "name": "form1",
        "description": None,
        "version": 1,
        "database_id": 1,
        "schema_oid": 18145,
        "base_table_oid": 18152,
        "associated_role_id": 121,
        "header_title": {
            "title": "text"
        },
        "header_subtitle": None,
        "publish_public": False,
        "submit_message": None,
        "submit_redirect_url": None,
        "submit_button_label": None,
        "fields": [
            {
                "id": 70,
                "key": "k1",
                "form_id": 42,
                "index": 1,
                "label": "Authors",
                "help": None,
                "kind": "foreign_key",
                "column_attnum": 10,
                "related_table_oid": 18146,
                "fk_interaction_rule": "can_pick_or_create",
                "styling": None,
                "is_required": False,
                "child_fields": [
                    {
                        "id": 71,
                        "key": "k2",
                        "form_id": 42,
                        "index": 2,
                        "label": "First Name",
                        "help": None,
                        "kind": "scalar_column",
                        "column_attnum": 2,
                        "related_table_oid": None,
                        "fk_interaction_rule": None,
                        "styling": None,
                        "is_required": False,
                        "child_fields": []
                    },
                    {
                        "id": 72,
                        "key": "k3",
                        "form_id": 42,
                        "index": 3,
                        "label": "Last Name",
                        "help": None,
                        "kind": "scalar_column",
                        "column_attnum": 3,
                        "related_table_oid": None,
                        "fk_interaction_rule": None,
                        "styling": None,
                        "is_required": False,
                        "child_fields": []
                    }
                ]
            }
        ]
    }
}


def mock_forms_info():
    form = test_data_form1['form']
    fields = test_data_form1['fields']

    mock_child_fields = MagicMock()
    mock_child_fields.all.return_value = fields[1:]

    mock_empty_child_fields = MagicMock()
    mock_empty_child_fields.all.return_value = []

    def _child_fields(self):
        return mock_child_fields if self is fields[0] else mock_empty_child_fields

    type(fields[0]).child_fields = property(_child_fields)

    mock_fields_manager = MagicMock()
    mock_fields_manager.all.return_value = fields
    mock_fields_manager.filter.return_value = [fields[0]]
    type(form).fields = PropertyMock(return_value=mock_fields_manager)

    return form


def test_forms_add(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')

    def mock_create_form(form_def, user):
        return mock_forms_info()

    monkeypatch.setattr(forms, 'create_form', mock_create_form)
    expect_form_info = test_data_form1['expected_form_info']
    form_def = {
        "name": "form1",
        "version": 1,
        "database_id": 1,
        "schema_oid": 18145,
        "base_table_oid": 18152,
        "associated_role_id": 121,
        "header_title": {"title": "text"},
        "fields": [
            {
                "key": "k1",
                "index": 1,
                "label": "Authors",
                "kind": "foreign_key",
                "column_attnum": 10,
                "related_table_oid": 18146,
                "fk_interaction_rule": "can_pick_or_create",
                "child_fields": [
                    {
                        "key": "k2",
                        "index": 2,
                        "label": "First Name",
                        "kind": "scalar_column",
                        "column_attnum": 2
                    },
                    {
                        "key": "k3",
                        "index": 3,
                        "label": "Last Name",
                        "kind": "scalar_column",
                        "column_attnum": 3,
                    }
                ]
            }
        ]
    }
    actual_form_info = forms.add(form_def=form_def, request=request)
    assert actual_form_info == expect_form_info


def test_forms_get(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')

    def mock_forms_get(form_token):
        return mock_forms_info()

    form_token = "db1bbb54-58df-4d5b-9909-a8b856f5a804"
    monkeypatch.setattr(forms, 'get_form', mock_forms_get)
    expect_form_info = test_data_form1['expected_form_info']
    actual_form_info = forms.get(form_token=form_token, request=request)
    assert actual_form_info == expect_form_info
