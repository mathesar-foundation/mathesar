import json
from unittest.mock import patch

from db.columns.operations import alter as col_alt


def test_alter_columns_in_table_basic():
    with patch.object(col_alt.db_conn, 'exec_msar_func') as mock_exec:
        col_alt.alter_columns_in_table(
            123,
            [
                {
                    "id": 3, "name": "colname3", "type": "numeric",
                    "type_options": {"precision": 8}, "nullable": True,
                    "default": {"value": 8, "is_dynamic": False},
                    "description": "third column"
                }, {
                    "id": 6, "name": "colname6", "type": "character varying",
                    "type_options": {"length": 32}, "nullable": True,
                    "default": {"value": "blahblah", "is_dynamic": False},
                    "description": "textual column"
                }
            ],
            'conn'
        )
        expect_json_arg = [
            {
                "attnum": 3, "name": "colname3",
                "type": {"name": "numeric", "options": {"precision": 8}},
                "not_null": False, "default": 8, "description": "third column",
            }, {
                "attnum": 6, "name": "colname6",
                "type": {
                    "name": "character varying", "options": {"length": 32},
                },
                "not_null": False, "default": "blahblah",
                "description": "textual column"
            }
        ]
        assert mock_exec.call_args.args[:3] == ('conn', 'alter_columns', 123)
        # Necessary since `json.dumps` mangles dict ordering, but we don't care.
        assert json.loads(mock_exec.call_args.args[3]) == expect_json_arg
