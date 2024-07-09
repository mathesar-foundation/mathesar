from unittest.mock import patch
from db.roles.operations import select as ma_sel


def test_get_roles():
    with patch.object(ma_sel, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = ma_sel.get_roles('conn')
    mock_exec.assert_called_once_with('conn', 'get_roles')
    assert result == 'a'
