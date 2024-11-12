import pytest
import requests
from urllib import parse as urlparse

SERVICE_HOST = 'http://mathesar-api-test-service:8000'
INTERNAL_HOST = 'mathesar-test-db'
EXTERNAL_HOST = 'mathesar-test-user-db'
RPC_ENDPOINT = f'{SERVICE_HOST}/api/rpc/v0/'
MATHESAR_DB = 'mathesar'

@pytest.fixture(scope="session")
def admin_session():
    login_payload = {'username': 'admin', 'password': 'password'}
    s = requests.Session()
    s.get(f'{SERVICE_HOST}/auth/login/')
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    s.post(f'{SERVICE_HOST}/auth/login/', data=login_payload)
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    return s


@pytest.fixture(scope="session")
def admin_rpc_call(admin_session):
    def _admin_rpc_request(function, **kwargs):
        return admin_session.post(
            RPC_ENDPOINT,
            json={
                "jsonrpc": "2.0",
                "method": function,
                "params": kwargs,
                "id": 0,
            }
        ).json()['result']
    return _admin_rpc_request


def test_empty_db_list(admin_rpc_call):
    db_list = admin_rpc_call('databases.configured.list')
    assert db_list == []


def test_create_mathesar_db_internal(admin_rpc_call):
    global internal_db
    result = admin_rpc_call(
        'databases.setup.create_new',
        database='mathesar',
        sample_data=['library_management']
    )
    assert set(result.keys()) == set(['configured_role', 'database', 'server'])
    internal_db = result['database']
    assert internal_db['name'] == 'mathesar'
    assert internal_db['needs_upgrade_attention'] is False


def test_connect_mathesar_db_external(admin_rpc_call):
    global external_db
    result = admin_rpc_call(
        'databases.setup.connect_existing',
        host='mathesar-test-user-db',
        port=5432,
        database='my_data',
        role='data_admin',
        password='data1234',
    )
    assert set(result.keys()) == set(['configured_role', 'database', 'server'])
    external_db = result['database']
    assert external_db['name'] == 'my_data'
    assert external_db['needs_upgrade_attention'] is False
    assert result['configured_role']['name'] == 'data_admin'


def test_list_databases_has_upgrade_status(admin_rpc_call):
    result = admin_rpc_call('databases.configured.list')
    assert all(d['needs_upgrade_attention'] is False for d in result)


def test_batch_sql_update_no_error(admin_session):
    # globals: internal_db, external_db
    admin_session.post(
        RPC_ENDPOINT,
        json=[
            {
                "jsonrpc": "2.0",
                "method": "databases.upgrade_sql",
                "id": "0",
                "params": {"database_id": internal_db["id"]}
            },
            {
                "jsonrpc": "2.0",
                "method": "databases.upgrade_sql",
                "id": "2",
                "params": {"database_id": external_db["id"]}
            },
        ]
    )
