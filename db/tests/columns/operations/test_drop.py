from unittest.mock import patch
from db.columns.operations import drop as col_drop


def test_drop_columns():
    with patch.object(col_drop.db_conn, 'exec_msar_func') as mock_exec:
        result = col_drop.drop_columns_from_table(123, [1, 3, 5], 'conn')
    mock_exec.assert_called_once_with('conn', 'drop_columns', 123, 1, 3, 5)
    assert result is None


def test_get_column_info_for_table():
    with patch.object(col_drop.db_conn, 'exec_msar_func') as mock_exec:
        result = col_drop.drop_columns_from_table(123, [1], 'conn')
    mock_exec.assert_called_once_with('conn', 'drop_columns', 123, 1)
    assert result is None
