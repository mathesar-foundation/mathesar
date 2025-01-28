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
    s.post(f'{SERVICE_HOST}/auth/password_reset_confirm/', data=reset_payload)
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
    db_list = admin_rpc_call('databases.configured.list')
    assert db_list == []


def test_create_mathesar_db_internal(admin_rpc_call):
    global internal_db_id
    global internal_server_id
    result = admin_rpc_call(
        'databases.setup.create_new',
        database='mathesar',
        sample_data=['library_management']
    )
    assert set(result.keys()) == set(['configured_role', 'database', 'server'])
    internal_db = result['database']
    internal_server = result['server']
    assert internal_db['name'] == 'mathesar'
    assert internal_db['needs_upgrade_attention'] is False
    internal_db_id = internal_db['id']
    internal_server_id = internal_server['id']


def test_connect_mathesar_db_external(admin_rpc_call):
    global external_db_id
    result = admin_rpc_call(
        'databases.setup.connect_existing',
        host=EXTERNAL_HOST,
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
    external_db_id = external_db['id']


def test_list_databases_has_upgrade_status(admin_rpc_call):
    result = admin_rpc_call('databases.configured.list')
    assert all(d['needs_upgrade_attention'] is False for d in result)


def test_batch_sql_update_no_error(admin_session):
    admin_session.post(
        RPC_ENDPOINT,
        json=[
            {
                "jsonrpc": "2.0",
                "method": "databases.upgrade_sql",
                "id": "0",
                "params": {"database_id": internal_db_id}
            },
            {
                "jsonrpc": "2.0",
                "method": "databases.upgrade_sql",
                "id": "2",
                "params": {"database_id": external_db_id}
            },
        ]
    )


def test_get_current_role(admin_rpc_call):
    global mathesar_role_oid
    result = admin_rpc_call(
        'roles.get_current_role',
        database_id=internal_db_id,
    )
    assert result['current_role']['super'] is True
    mathesar_role_oid = result['current_role']['oid']


# Now the scenario proper starts. The admin will add an `intern` user to
# Mathesar, an `intern` role to the internal `mathesar` DB, then grant
# `CONNECT` to that role on the DB, `USAGE` on "Library Management", and
# `SELECT` on "Books". We'll make sure the intern has the correct
# privileges at each step.
#
# We'll follow along with the API calls made by the front end.


def test_add_user(admin_rpc_call):
    global intern_user_id
    before_users = admin_rpc_call('users.list')
    assert len(before_users) == 1
    intern_add = {
        'display_language': 'en',
        'email': 'intern@example.com',
        'is_superuser': False,
        'password': 'password',
        'username': 'intern',
    }
    admin_rpc_call('users.add', user_def=intern_add)
    after_users = admin_rpc_call('users.list')
    assert len(after_users) == 2
    intern_user_id = [
        u['id'] for u in after_users if u['username'] == 'intern'
    ][0]


def test_intern_no_databases(intern_rpc_call):
    db_list = intern_rpc_call('databases.configured.list')
    assert db_list == []


def test_list_configured_roles(admin_rpc_call):
    # The only role at this point should be the initial `mathesar` role.
    result = admin_rpc_call(
        'roles.configured.list',
        server_id=internal_server_id,
    )
    assert len(result) == 1


def test_add_role(admin_rpc_call):
    global intern_role_oid
    result = admin_rpc_call(
        'roles.add',
        database_id=internal_db_id,
        login=True,
        rolename='intern',
        password='internpass'
    )
    intern_role_oid = result['oid']


def test_configure_role(admin_rpc_call):
    global intern_configured_role_id
    result = admin_rpc_call(
        'roles.configured.add',
        name='intern',
        password='internpass',
        server_id=internal_server_id,
    )
    assert 'password' not in result.keys()
    intern_configured_role_id = result['id']


def test_add_collaborator(admin_rpc_call):
    before_collaborators = admin_rpc_call(
        'collaborators.list',
        database_id=internal_db_id,
    )
    # Should only have the admin so far
    assert len(before_collaborators) == 1
    admin_rpc_call(
        'collaborators.add',
        configured_role_id=intern_configured_role_id,
        database_id=internal_db_id,
        user_id=intern_user_id,
    )
    after_collaborators = admin_rpc_call(
        'collaborators.list',
        database_id=internal_db_id,
    )
    assert len(after_collaborators) == 2
    intern_collab_definition = [
        c for c in after_collaborators if c['user_id'] == intern_user_id
    ][0]
    assert intern_collab_definition['database_id'] == internal_db_id
    assert intern_collab_definition['configured_role_id'] == intern_configured_role_id


def test_intern_has_internal_database(intern_rpc_call):
    db_list = intern_rpc_call('databases.configured.list')
    assert len(db_list) == 1
    assert db_list[0]['id'] == internal_db_id


def test_database_privileges_add(admin_rpc_call):
    before_result = admin_rpc_call(
        'databases.privileges.list_direct',
        database_id=internal_db_id,
    )
    # `intern` shouldn't have any privileges yet.
    assert intern_role_oid not in [r['role_oid'] for r in before_result]
    after_result = admin_rpc_call(
        'databases.privileges.replace_for_roles',
        database_id=internal_db_id,
        privileges=[{'direct': ['CONNECT'], 'role_oid': intern_role_oid}]
    )
    # `intern` should have `CONNECT` after this point.
    assert [
        d['direct'] for d in after_result if d['role_oid'] == intern_role_oid
    ][0] == ['CONNECT']


def test_schemas_list(admin_rpc_call):
    global library_management_oid
    result = admin_rpc_call(
        'schemas.list',
        database_id=1
    )
    # Should have `public` and `Library Management`
    assert len(result) == 2
    library_management_oid = [
        s['oid'] for s in result if s['name'] == 'Library Management'
    ][0]


def test_tables_list(admin_rpc_call):
    global books_oid
    result = admin_rpc_call(
        'tables.list',
        database_id=1,
        schema_oid=library_management_oid
    )
    assert len(result) == 7
    books_oid = [t['oid'] for t in result if t['name'] == 'Books'][0]


def test_intern_cannot_access_library_schema_tables(intern_session):
    response = intern_session.post(
        RPC_ENDPOINT,
        json={
            "jsonrpc": "2.0",
            "method": 'records.list',
            "params": {
                "table_oid": books_oid,
                "database_id": internal_db_id,
                "limit": 20
            },
            "id": 0,
        }
    ).json()
    assert response['error']['code'] == -30101  # InsufficientPrivilege
    assert "permission denied for schema" in response['error']['message']


def test_schema_privileges_add(admin_rpc_call):
    before_result = admin_rpc_call(
        'schemas.privileges.list_direct',
        database_id=internal_db_id,
        schema_oid=library_management_oid,
    )
    # `intern` should not have any schema privileges yet.
    assert intern_role_oid not in [r['role_oid'] for r in before_result]
    after_result = admin_rpc_call(
        'schemas.privileges.replace_for_roles',
        database_id=internal_db_id,
        schema_oid=library_management_oid,
        privileges=[{'direct': ['USAGE'], 'role_oid': intern_role_oid}],
    )
    assert [
        d['direct'] for d in after_result if d['role_oid'] == intern_role_oid
    ][0] == ['USAGE']


def test_intern_still_cannot_access_books_table_data(intern_session):
    response = intern_session.post(
        RPC_ENDPOINT,
        json={
            "jsonrpc": "2.0",
            "method": 'records.list',
            "params": {
                "table_oid": books_oid,
                "database_id": internal_db_id,
                "limit": 20
            },
            "id": 0,
        }
    ).json()
    assert response['error']['code'] == -30101  # InsufficientPrivilege
    assert "permission denied for table" in response['error']['message']


def test_table_privileges_add(admin_rpc_call):
    before_result = admin_rpc_call(
        'tables.privileges.list_direct',
        table_oid=books_oid,
        database_id=internal_db_id,
    )
    # `intern` should not have any schema privileges yet.
    assert intern_role_oid not in [r['role_oid'] for r in before_result]
    after_result = admin_rpc_call(
        'tables.privileges.replace_for_roles',
        table_oid=books_oid,
        database_id=internal_db_id,
        privileges=[{'direct': ['SELECT'], 'role_oid': intern_role_oid}],
    )
    assert [
        d['direct'] for d in after_result if d['role_oid'] == intern_role_oid
    ][0] == ['SELECT']


def test_intern_can_now_access_books_table(intern_rpc_call):
    records = intern_rpc_call(
        'records.list',
        table_oid=books_oid,
        database_id=internal_db_id,
        limit=20,
    )
    assert records['count'] == 1410
    assert len(records['results']) == 20


def test_disconnect_fails_when_dependencies(admin_session):
    response = admin_session.post(
        RPC_ENDPOINT,
        json={
            "jsonrpc": "2.0",
            "method": "databases.configured.disconnect",
            "params": {
                "database_id": internal_db_id,
            },
            "id": 0,
        },
    ).json()
    assert response['error']['code'] == -30035  # DependentObjectsStillExist


def test_disconnect_succeeds_when_no_dependencies(admin_rpc_call):
    admin_rpc_call(
        "databases.configured.disconnect",
        database_id=internal_db_id,
        schemas_to_remove=["msar", "__msar"]
    )
    result = admin_rpc_call('databases.configured.list')
    assert len(result) == 1
    assert internal_db_id not in [d["id"] for d in result]
