from unittest.mock import patch
from db.tables.operations import select as ma_sel


def test_get_table_info():
    with patch.object(ma_sel, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = ma_sel.get_table_info('schema', 'conn')
    mock_exec.assert_called_once_with('conn', 'get_table_info', 'schema')
    assert result == 'a'
