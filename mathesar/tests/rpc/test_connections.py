import pytest
from unittest.mock import patch
import mathesar.rpc.connections as rpc_conn


@pytest.mark.parametrize(
    "create_db", [True, False]
)
@pytest.mark.parametrize(
    "connection_id", [None, 3]
)
@pytest.mark.parametrize(
    "sample_data", [
        [],
        ['library_management'],
        ['movie_collection'],
        ['library_management', 'movie_collection']
    ]
)
def test_add_from_known_connection(create_db, connection_id, sample_data):
    with patch.object(rpc_conn, 'DBModelReturn'):
        with patch.object(
            rpc_conn.connections,
            'copy_connection_from_preexisting'
        ) as mock_exec:
            rpc_conn.add_from_known_connection(
                nickname='mathesar_tables',
                database='mathesar',
                create_db=create_db,
                connection_id=connection_id,
                sample_data=sample_data
            )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == {
        'connection_type': 'internal_database',
        'connection_id': connection_id
    } or {
        'connection_type': 'user_database',
        'connection_id': connection_id
    }
    assert call_args[1] == 'mathesar_tables'
    assert call_args[2] == 'mathesar'
    assert call_args[3] == create_db
    assert call_args[4] == sample_data


@pytest.mark.parametrize(
    "port", ['5432', 5432]
)
@pytest.mark.parametrize(
    "sample_data", [
        [],
        ['library_management'],
        ['movie_collection'],
        ['library_management', 'movie_collection']
    ]
)
def test_add_from_scratch(port, sample_data):
    with patch.object(rpc_conn, 'DBModelReturn'):
        with patch.object(
            rpc_conn.connections,
            'create_connection_from_scratch'
        ) as mock_exec:
            rpc_conn.add_from_scratch(
                nickname='mathesar_tables',
                database='mathesar',
                user='mathesar_user',
                password='mathesar_password',
                host='mathesar_dev_db',
                port=port,
                sample_data=sample_data
            )
    call_args = mock_exec.call_args_list[0][0]
    assert call_args[0] == 'mathesar_user'
    assert call_args[1] == 'mathesar_password'
    assert call_args[2] == 'mathesar_dev_db'
    assert call_args[3] == port
    assert call_args[4] == 'mathesar_tables'
    assert call_args[5] == 'mathesar'
    assert call_args[6] == sample_data
