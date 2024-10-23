import json
from unittest.mock import patch
from db import roles


def test_list_roles():
    with patch.object(roles, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = roles.list_roles('conn')
    mock_exec.assert_called_once_with('conn', 'list_roles')
    assert result == 'a'


def test_list_schema_privileges():
    with patch.object(roles, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = roles.list_schema_privileges(123456, 'conn')
    mock_exec.assert_called_once_with('conn', 'list_schema_privileges', 123456)
    assert result == 'a'


def test_replace_database_privileges_for_roles():
    priv_spec = [{"role_oid": 1234, "privileges": ["CONNECT", "CREATE"]}]
    with patch.object(roles, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = roles.replace_database_privileges_for_roles('conn', priv_spec)
    mock_exec.assert_called_once_with(
        'conn', 'replace_database_privileges_for_roles', json.dumps(priv_spec)
    )
    assert result == 'a'


def test_replace_schema_privileges_for_roles():
    schema_oid = 12345
    priv_spec = [{"role_oid": 1234, "privileges": ["UPDATE", "CREATE"]}]
    with patch.object(roles, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = roles.replace_schema_privileges_for_roles(
            'conn', schema_oid, priv_spec
        )
    mock_exec.assert_called_once_with(
        'conn', 'replace_schema_privileges_for_roles',
        schema_oid, json.dumps(priv_spec)
    )
    assert result == 'a'
