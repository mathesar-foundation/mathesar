from unittest.mock import patch
from db.columns.operations import select as col_select


def test_get_column_info_for_table():
    with patch.object(col_select, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: ('a', 'b')
        result = col_select.get_column_info_for_table('table', 'conn')
    mock_exec.assert_called_once_with('conn', 'get_column_info', 'table')
    assert result == 'a'
