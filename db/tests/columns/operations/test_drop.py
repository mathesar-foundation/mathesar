from unittest.mock import patch
from db.columns.operations import drop as col_drop


def test_drop_columns():
    with patch.object(col_drop.db_conn, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: (3,)
        result = col_drop.drop_columns_from_table(123, [1, 3, 5], 'conn')
    mock_exec.assert_called_once_with('conn', 'drop_columns', 123, 1, 3, 5)
    assert result == 3


def test_drop_columns_single():
    with patch.object(col_drop.db_conn, 'exec_msar_func') as mock_exec:
        mock_exec.return_value.fetchone = lambda: (1,)
        result = col_drop.drop_columns_from_table(123, [1], 'conn')
    mock_exec.assert_called_once_with('conn', 'drop_columns', 123, 1)
    assert result == 1
