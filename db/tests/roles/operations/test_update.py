from unittest.mock import patch
from db.roles.operations import update as rupdate


def test_replace_database_privileges_for_roles():
    priv_spec = [{"role_oid": 1234, "privileges": ["CONNECT", "CREATE"]}]
    with patch.object(rupdate, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = rupdate.replace_database_privileges_for_roles('conn', priv_spec)
    mock_exec.assert_called_once_with(
        'conn', 'replace_database_privileges_for_roles', priv_spec
    )
    assert result == 'a'
