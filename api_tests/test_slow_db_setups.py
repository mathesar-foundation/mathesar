import time
import pytest
import requests

SERVICE_HOST = 'http://mathesar-api-test-service:8000'
EXTERNAL_HOST = 'mathesar-test-user-db'
RPC_ENDPOINT = f'{SERVICE_HOST}/api/rpc/v0/'


@pytest.fixture(scope="module")
def admin_session():
    login_payload = {"username": "admin", "password": "password"}
    s = requests.Session()
    s.get(f'{SERVICE_HOST}/auth/login/')
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    s.post(f'{SERVICE_HOST}/auth/login/', data=login_payload)
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    return s


@pytest.fixture(scope="module")
def admin_rpc_call(admin_session):
    def _admin_rpc_request(function, **kwargs):
        response = admin_session.post(
            RPC_ENDPOINT,
            json={
                "jsonrpc": "2.0",
                "method": function,
                "params": kwargs,
                "id": 0,
            }
        ).json()
        return response['result']
    return _admin_rpc_request


@pytest.fixture(scope="module")
def intern_session():
    # This function handles Django's auto-password-reset flow
    # NOTE: This will only work after the admin adds `intern` as a user!
    init_login_payload = {"username": "intern", "password": "password"}
    s = requests.Session()
    s.get(f'{SERVICE_HOST}/auth/login/')
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    s.post(f'{SERVICE_HOST}/auth/login/', data=init_login_payload)
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    reset_payload = {
        "new_password1": "myinternpass1234",
        "new_password2": "myinternpass1234"
    }
    s.post(f'{SERVICE_HOST}/auth/password_reset_confirm', data=reset_payload)
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    new_login_payload = {"username": "intern", "password": "myinternpass1234"}
    s.post(f'{SERVICE_HOST}/auth/login/', data=new_login_payload)
    s.headers['X-CSRFToken'] = s.cookies['csrftoken']
    return s


@pytest.fixture(scope="module")
def intern_rpc_call(intern_session):
    def _intern_rpc_request(function, **kwargs):
        response = intern_session.post(
            RPC_ENDPOINT,
            json={
                "jsonrpc": "2.0",
                "method": function,
                "params": kwargs,
                "id": 0,
            }
        ).json()
        return response['result']
    return _intern_rpc_request


def test_empty_db_list(admin_rpc_call):
    s = time.time()
    admin_rpc_call('databases.configured.list')
    elapsed = time.time() - s
    print(elapsed)
