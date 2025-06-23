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


def test_forms_add(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')

    def mock_forms_info(form_def, user):
        form = Form(
            id=42,
            created_at="2025-06-13T23:18:05.108Z",
            updated_at="2025-06-13T23:18:05.108Z",
            token="db1bbb54-58df-4d5b-9909-a8b856f5a804",
            name="form1",
            description=None,
            version=1,
            database_id=1,
            server_id=2,
            schema_oid=18145,
            base_table_oid=18152,
            is_public=False,
            header_title={"title": "text"},
            header_subtitle=None,
            submit_role_id=1,
            submit_message=None,
            redirect_url=None,
            submit_label=None,
        )

        fields = [
            FormField(
                id=70,
                key="k1",
                attnum=10,
                form_id=42,
                index=1,
                kind="foreign_key",
                label="Authors",
                help=None,
                readonly=False,
                styling=None,
                is_required=False,
                parent_field_id=None,
                target_table_oid=18146,
                allow_create=False,
                create_label=None
            ),
            FormField(
                id=71,
                key="k2",
                attnum=2,
                form_id=42,
                index=2,
                kind="scalar_column",
                label="First Name",
                help=None,
                readonly=False,
                styling=None,
                is_required=False,
                parent_field_id=70,
                target_table_oid=None,
                allow_create=False,
                create_label=None
            ),
            FormField(
                id=72,
                key="k3",
                attnum=3,
                form_id=42,
                index=3,
                kind="scalar_column",
                label="Last Name",
                help=None,
                readonly=False,
                styling=None,
                is_required=False,
                parent_field_id=70,
                target_table_oid=None,
                allow_create=False,
                create_label=None
            )
        ]
        mock_fields_manager = MagicMock()
        mock_fields_manager.all.return_value = fields
        type(form).fields = PropertyMock(return_value=mock_fields_manager)
        field_col_info_map = {
            "k1": {
                "column": {
                    "id": 10,
                    "name": "Author",
                    "type": "integer",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k2": {
                "column": {
                    "id": 2,
                    "name": "First Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k3": {
                "column": {
                    "id": 3,
                    "name": "Last Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            }
        }
        return form, field_col_info_map
    monkeypatch.setattr(forms, 'create_form', mock_forms_info)
    expect_form_info = {
        "id": 42,
        "created_at": "2025-06-13T23:18:05.108Z",
        "updated_at": "2025-06-13T23:18:05.108Z",
        "token": "db1bbb54-58df-4d5b-9909-a8b856f5a804",
        "name": "form1",
        "description": None,
        "version": 1,
        "database_id": 1,
        "server_id": 2,
        "schema_oid": 18145,
        "base_table_oid": 18152,
        "is_public": False,
        "header_title": {
            "title": "text"
        },
        "header_subtitle": None,
        "submit_role_id": 1,
        "submit_message": None,
        "redirect_url": None,
        "submit_label": None,
        "fields": [
            {
                "id": 70,
                "key": "k1",
                "attnum": 10,
                "form_id": 42,
                "index": 1,
                "kind": "foreign_key",
                "label": "Authors",
                "help": None,
                "readonly": False,
                "styling": None,
                "is_required": False,
                "parent_field_id": None,
                "target_table_oid": 18146,
                "allow_create": False,
                "create_label": None
            },
            {
                "id": 71,
                "key": "k2",
                "attnum": 2,
                "form_id": 42,
                "index": 2,
                "kind": "scalar_column",
                "label": "First Name",
                "help": None,
                "readonly": False,
                "styling": None,
                "is_required": False,
                "parent_field_id": 70,
                "target_table_oid": None,
                "allow_create": False,
                "create_label": None
            },
            {
                "id": 72,
                "key": "k3",
                "attnum": 3,
                "form_id": 42,
                "index": 3,
                "kind": "scalar_column",
                "label": "Last Name",
                "help": None,
                "readonly": False,
                "styling": None,
                "is_required": False,
                "parent_field_id": 70,
                "target_table_oid": None,
                "allow_create": False,
                "create_label": None
            }
        ],
        "field_col_info_map": {
            "k1": {
                "column": {
                    "id": 10,
                    "name": "Author",
                    "type": "integer",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k2": {
                "column": {
                    "id": 2,
                    "name": "First Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k3": {
                "column": {
                    "id": 3,
                    "name": "Last Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            }
        }
    }
    form_def = {
        "name": "form1",
        "version": 1,
        "database_id": 1,
        "server_id": 2,
        "schema_oid": 18145,
        "base_table_oid": 18152,
        "header_title": {"title": "text"},
        "fields": [
            {
                "key": "k1",
                "attnum": 10,
                "index": 1,
                "kind": "foreign_key",
                "label": "Authors",
                "target_table_oid": 18146
            },
            {
                "key": "k2",
                "attnum": 2,
                "index": 2,
                "kind": "scalar_column",
                "label": "First Name",
                "parent_field_key": "k1"
            },
            {
                "key": "k3",
                "attnum": 3,
                "index": 3,
                "kind": "scalar_column",
                "label": "Last Name",
                "parent_field_key": "k1"
            }
        ]
    }
    actual_form_info = forms.add(form_def=form_def, request=request)
    assert actual_form_info == expect_form_info


def test_forms_get(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')

    def mock_forms_get(form_id):
        form = Form(
            id=42,
            created_at="2025-06-13T23:18:05.108Z",
            updated_at="2025-06-13T23:18:05.108Z",
            token="db1bbb54-58df-4d5b-9909-a8b856f5a804",
            name="form1",
            description=None,
            version=1,
            database_id=1,
            server_id=2,
            schema_oid=18145,
            base_table_oid=18152,
            is_public=False,
            header_title={"title": "text"},
            header_subtitle=None,
            submit_role_id=1,
            submit_message=None,
            redirect_url=None,
            submit_label=None,
        )

        fields = [
            FormField(
                id=70,
                key="k1",
                attnum=10,
                form_id=42,
                index=1,
                kind="foreign_key",
                label="Authors",
                help=None,
                readonly=False,
                styling=None,
                is_required=False,
                parent_field_id=None,
                target_table_oid=18146,
                allow_create=False,
                create_label=None
            ),
            FormField(
                id=71,
                key="k2",
                attnum=2,
                form_id=42,
                index=2,
                kind="scalar_column",
                label="First Name",
                help=None,
                readonly=False,
                styling=None,
                is_required=False,
                parent_field_id=70,
                target_table_oid=None,
                allow_create=False,
                create_label=None
            ),
            FormField(
                id=72,
                key="k3",
                attnum=3,
                form_id=42,
                index=3,
                kind="scalar_column",
                label="Last Name",
                help=None,
                readonly=False,
                styling=None,
                is_required=False,
                parent_field_id=70,
                target_table_oid=None,
                allow_create=False,
                create_label=None
            )
        ]
        mock_fields_manager = MagicMock()
        mock_fields_manager.all.return_value = fields
        type(form).fields = PropertyMock(return_value=mock_fields_manager)
        field_col_info_map = {
            "k1": {
                "column": {
                    "id": 10,
                    "name": "Author",
                    "type": "integer",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k2": {
                "column": {
                    "id": 2,
                    "name": "First Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k3": {
                "column": {
                    "id": 3,
                    "name": "Last Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            }
        }
        return form, field_col_info_map
    monkeypatch.setattr(forms, 'get_form', mock_forms_get)
    expect_form_info = {
        "id": 42,
        "created_at": "2025-06-13T23:18:05.108Z",
        "updated_at": "2025-06-13T23:18:05.108Z",
        "token": "db1bbb54-58df-4d5b-9909-a8b856f5a804",
        "name": "form1",
        "description": None,
        "version": 1,
        "database_id": 1,
        "server_id": 2,
        "schema_oid": 18145,
        "base_table_oid": 18152,
        "is_public": False,
        "header_title": {
            "title": "text"
        },
        "header_subtitle": None,
        "submit_role_id": 1,
        "submit_message": None,
        "redirect_url": None,
        "submit_label": None,
        "fields": [
            {
                "id": 70,
                "key": "k1",
                "attnum": 10,
                "form_id": 42,
                "index": 1,
                "kind": "foreign_key",
                "label": "Authors",
                "help": None,
                "readonly": False,
                "styling": None,
                "is_required": False,
                "parent_field_id": None,
                "target_table_oid": 18146,
                "allow_create": False,
                "create_label": None
            },
            {
                "id": 71,
                "key": "k2",
                "attnum": 2,
                "form_id": 42,
                "index": 2,
                "kind": "scalar_column",
                "label": "First Name",
                "help": None,
                "readonly": False,
                "styling": None,
                "is_required": False,
                "parent_field_id": 70,
                "target_table_oid": None,
                "allow_create": False,
                "create_label": None
            },
            {
                "id": 72,
                "key": "k3",
                "attnum": 3,
                "form_id": 42,
                "index": 3,
                "kind": "scalar_column",
                "label": "Last Name",
                "help": None,
                "readonly": False,
                "styling": None,
                "is_required": False,
                "parent_field_id": 70,
                "target_table_oid": None,
                "allow_create": False,
                "create_label": None
            }
        ],
        "field_col_info_map": {
            "k1": {
                "column": {
                    "id": 10,
                    "name": "Author",
                    "type": "integer",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k2": {
                "column": {
                    "id": 2,
                    "name": "First Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            },
            "k3": {
                "column": {
                    "id": 3,
                    "name": "Last Name",
                    "type": "text",
                    "default": None,
                    "nullable": True,
                    "description": None,
                    "primary_key": False,
                    "type_options": None,
                    "has_dependents": False,
                    "current_role_priv": [
                        "SELECT",
                        "INSERT",
                        "UPDATE",
                        "REFERENCES"
                    ],
                    "metadata": None
                },
                "error": None
            }
        }
    }
    actual_form_info = forms.get(form_id=42, request=request)
    assert actual_form_info == expect_form_info
