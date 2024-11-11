import pytest
import requests
from urllib import parse as urlparse

SERVICE_HOST = 'http://mathesar-api-test-service:8000'
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


def test_empty_db_list(admin_session):
    response = admin_session.post(
        RPC_ENDPOINT,
        json={"jsonrpc": "2.0", "method": "databases.configured.list", "id": 0}
    )
    print(response.json())
    assert response.json()['result'] == []


def test_create_mathesar_db_internal(admin_session):
    response = admin_session.post(
        RPC_ENDPOINT,
        json={
            "jsonrpc": "2.0",
            "method": "databases.setup.create_new",
            "id": 0,
            "params": {
                "database": "mathesar",
                "sample_data": ["library_management"],
            }
        }
    )
    print(response.json())
    result = response.json()['result']
    assert set(result.keys()) == set(['configured_role', 'database', 'server'])
    assert result['database']['name'] == 'mathesar'
    assert result['database']['needs_upgrade_attention'] is False


def test_connect_mathesar_db_external(admin_session):
    response = admin_session.post(
        RPC_ENDPOINT,
        json={
            "jsonrpc": "2.0",
            "method": "databases.setup.connect_existing",
            "id": 0,
            "params": {
                "host": "mathesar-test-user-db",
                "port": 5432,
                "database": "my_data",
                "role": "data_admin",
                "password": "data1234",
            }
        }
    )
    print(response.json())
    result = response.json()['result']
    assert set(result.keys()) == set(['configured_role', 'database', 'server'])
    assert result['database']['name'] == 'my_data'
    assert result['database']['needs_upgrade_attention'] is False
    assert result['configured_role']['name'] == 'data_admin'
