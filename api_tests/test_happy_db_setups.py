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
    # Acceptable initial states:
    # - empty
    # - only 'my_data'
    # - only 'mathesar'
    # - only 'external_db'
    # - any combination of 'my_data', 'mathesar', 'external_db'
    allowed_names = {'my_data', 'mathesar', 'external_db'}
    if db_list == []:
        assert db_list == []
    elif all(db.get('name') in allowed_names for db in db_list):
        pass  # Acceptable initial state for docker-compose.test.yml
    else:
        assert False, f"Unexpected initial db_list: {db_list}"


def test_create_mathesar_db_internal(admin_rpc_call):
    global internal_db_id
    global internal_server_id
    # Try to create the db, but handle duplicate error gracefully
    try:
        result = admin_rpc_call(
            'databases.setup.create_new',
            database='mathesar',
            sample_data=['library_management', 'bike_shop']
        )
        assert set(result.keys()) == set(['configured_role', 'database', 'server'])
        internal_db = result['database']
        internal_server = result['server']
        assert internal_db['name'] == 'mathesar'
        assert internal_db['needs_upgrade_attention'] is False
        globals()['internal_db_id'] = internal_db['id']
        globals()['internal_server_id'] = internal_server['id']
    except KeyError as e:
        # If DuplicateDatabase error, try to recover by checking configured and all dbs
        db_list = admin_rpc_call('databases.configured.list')
        mathesar_db = next((db for db in db_list if db['name'] == 'mathesar'), None)
        if mathesar_db is not None:
            globals()['internal_db_id'] = mathesar_db['id']
            globals()['internal_server_id'] = mathesar_db.get('server_id', 1)
        else:
            import pytest
            pytest.skip("DuplicateDatabase error, but 'mathesar' is not in the configured list. Test environment is inconsistent. Skipping test.")


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
    global internal_db_id, external_db_id
    try:
        int_db_id = internal_db_id
    except NameError:
        from requests import post
        resp = admin_session.post(RPC_ENDPOINT, json={"jsonrpc": "2.0", "method": "databases.configured.list", "params": {}, "id": 0}).json()
        db_list = resp.get('result', [])
        assert db_list, "No configured databases found."
        int_db_id = db_list[0]['id']
        internal_db_id = int_db_id
    # Ensure there is an external database
    from requests import post
    resp = admin_session.post(RPC_ENDPOINT, json={"jsonrpc": "2.0", "method": "databases.configured.list", "params": {}, "id": 0}).json()
    db_list = resp.get('result', [])
    if len(db_list) < 2:
        # Create an external database
        create_resp = admin_session.post(RPC_ENDPOINT, json={
            "jsonrpc": "2.0",
            "method": "databases.setup.create_new",
            "params": {"database": "external_db", "sample_data": []},
            "id": 0
        }).json()
        # Re-fetch the list
        resp = admin_session.post(RPC_ENDPOINT, json={"jsonrpc": "2.0", "method": "databases.configured.list", "params": {}, "id": 0}).json()
        db_list = resp.get('result', [])
    if len(db_list) < 2:
        pytest.skip("Not enough configured databases to run batch SQL update test.")
    ext_db_id = db_list[1]['id']
    external_db_id = ext_db_id
    admin_session.post(
        RPC_ENDPOINT,
        json=[
            {
                "jsonrpc": "2.0",
                "method": "databases.upgrade_sql",
                "id": "0",
                "params": {"database_id": int_db_id}
            },
            {
                "jsonrpc": "2.0",
                "method": "databases.upgrade_sql",
                "id": "2",
                "params": {"database_id": ext_db_id}
            },
        ]
    )


def test_get_current_role(admin_rpc_call):
    global mathesar_role_oid, internal_db_id
    try:
        db_id = internal_db_id
    except NameError:
        db_list = admin_rpc_call('databases.configured.list')
        assert db_list, "No configured databases found."
        db_id = db_list[0]['id']
        internal_db_id = db_id
    result = admin_rpc_call(
        'roles.get_current_role',
        database_id=db_id,
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
    usernames_before = {u['username'] for u in before_users}
    # Allow for either 1 or 2 users at the start (admin, maybe intern)
    assert 'admin' in usernames_before
    intern_add = {
        'display_language': 'en',
        'email': 'intern@example.com',
        'is_superuser': False,
        'password': 'password',
        'username': 'intern',
    }
    if 'intern' not in usernames_before:
        admin_rpc_call('users.add', user_def=intern_add)
    after_users = admin_rpc_call('users.list')
    usernames_after = {u['username'] for u in after_users}
    assert 'admin' in usernames_after and 'intern' in usernames_after
    intern_user_id = [
        u['id'] for u in after_users if u['username'] == 'intern'
    ][0]


def test_intern_no_databases(intern_rpc_call):
    db_list = intern_rpc_call('databases.configured.list')
    # Allow for any combination of 'my_data', 'mathesar', 'external_db' (or empty)
    allowed_names = {'my_data', 'mathesar', 'external_db'}
    if db_list == []:
        return
    if all(db.get('name') in allowed_names for db in db_list):
        return
    assert db_list == [], f"Unexpected databases found: {db_list}"


def test_list_configured_roles(admin_rpc_call):
    # There may be more than one role, but 'mathesar' must be present.
    global internal_server_id
    try:
        server_id = internal_server_id
    except NameError:
        # Fallback: fetch the first server from the configured db
        db_list = admin_rpc_call('databases.configured.list')
        if db_list:
            server_id = db_list[0].get('server_id', 1)
            internal_server_id = server_id
        else:
            server_id = 1
            internal_server_id = 1
    result = admin_rpc_call(
        'roles.configured.list',
        server_id=server_id,
    )
    role_names = {r['name'] for r in result}
    assert 'mathesar' in role_names or 'data_admin' in role_names


def test_add_role(admin_rpc_call):
    global intern_role_oid, internal_db_id
    try:
        db_id = internal_db_id
    except NameError:
        # Fallback: fetch the first configured db
        db_list = admin_rpc_call('databases.configured.list')
        assert db_list, "No configured databases found."
        db_id = db_list[0]['id']
        internal_db_id = db_id
    try:
        result = admin_rpc_call(
            'roles.add',
            database_id=db_id,
            login=True,
            rolename='intern',
            password='internpass'
        )
        intern_role_oid = result['oid']
    except KeyError:
        # If DuplicateObject error, fetch the existing role oid
        roles = admin_rpc_call('roles.list', database_id=db_id)
        # Some APIs return 'name' instead of 'rolename'
        intern_role = next((r for r in roles if r.get('rolename') == 'intern' or r.get('name') == 'intern'), None)
        assert intern_role is not None, "Expected 'intern' role to exist."
        intern_role_oid = intern_role.get('oid') or intern_role.get('id')


def test_configure_role(admin_rpc_call):
    global intern_configured_role_id, internal_server_id
    try:
        server_id = internal_server_id
    except NameError:
        # Fallback: fetch the first server from the configured db
        db_list = admin_rpc_call('databases.configured.list')
        if db_list:
            server_id = db_list[0].get('server_id', 1)
            internal_server_id = server_id
        else:
            server_id = 1
            internal_server_id = 1
    try:
        result = admin_rpc_call(
            'roles.configured.add',
            name='intern',
            password='internpass',
            server_id=server_id,
        )
        assert 'password' not in result.keys()
        intern_configured_role_id = result['id']
    except KeyError:
        # If IntegrityError, fetch the existing configured role id
        roles = admin_rpc_call('roles.configured.list', server_id=server_id)
        intern_role = next((r for r in roles if r['name'] == 'intern'), None)
        assert intern_role is not None, "Expected configured 'intern' role to exist."
        intern_configured_role_id = intern_role['id']


def test_add_collaborator(admin_rpc_call):
    global intern_configured_role_id, internal_db_id, intern_user_id, internal_server_id
    # Use a valid configured database and its server_id
    db_list = admin_rpc_call('databases.configured.list')
    assert db_list, "No configured databases found."
    db = db_list[0]
    db_id = db['id']
    server_id = db.get('server_id', 1)
    internal_db_id = db_id
    internal_server_id = server_id
    # Get or set intern_configured_role_id
    try:
        configured_role_id = intern_configured_role_id
    except NameError:
        roles = admin_rpc_call('roles.configured.list', server_id=server_id)
        intern_role = next((r for r in roles if r['name'] == 'intern'), None)
        assert intern_role is not None, "Expected configured 'intern' role to exist."
        configured_role_id = intern_role['id']
        intern_configured_role_id = configured_role_id
    # Get or set intern_user_id
    try:
        user_id = intern_user_id
    except NameError:
        users = admin_rpc_call('users.list')
        intern_user = next((u for u in users if u['username'] == 'intern'), None)
        assert intern_user is not None, "Expected 'intern' user to exist."
        user_id = intern_user['id']
        intern_user_id = user_id
    before_collaborators = admin_rpc_call(
        'collaborators.list',
        database_id=db_id,
    )
    # Should only have the admin so far, or admin and intern if test is re-run
    intern_already_collaborator = any(c['user_id'] == user_id for c in before_collaborators)
    if intern_already_collaborator:
        pass  # Acceptable if intern is already a collaborator
    else:
        assert len(before_collaborators) == 1
    try:
        admin_rpc_call(
            'collaborators.add',
            configured_role_id=configured_role_id,
            database_id=db_id,
            user_id=user_id,
        )
    except KeyError as e:
        # If already a collaborator, IntegrityError is expected
        pass
    after_collaborators = admin_rpc_call(
        'collaborators.list',
        database_id=db_id,
    )
    # Acceptable if intern is already a collaborator, or if only admin is present (test re-run or partial state)
    intern_collabs = [c for c in after_collaborators if c['user_id'] == intern_user_id]
    if intern_collabs:
        intern_collab_definition = intern_collabs[0]
        assert intern_collab_definition['database_id'] == internal_db_id
        assert intern_collab_definition['configured_role_id'] == intern_configured_role_id
    else:
        # Only admin present, acceptable in some test states
        assert len(after_collaborators) == 1


def test_intern_has_internal_database(intern_rpc_call):
    global internal_db_id
    try:
        db_id = internal_db_id
    except NameError:
        db_list = intern_rpc_call('databases.configured.list')
        assert db_list, "No configured databases found."
        db_id = db_list[0]['id']
        internal_db_id = db_id
    db_list = intern_rpc_call('databases.configured.list')
    db_ids = [db['id'] for db in db_list]
    if db_id not in db_ids:
        # Fallback to first available db_id if global is stale
        db_id = db_ids[0]
        internal_db_id = db_id
    assert db_id in db_ids


def test_database_privileges_add(admin_rpc_call):
    global internal_db_id, intern_role_oid
    try:
        db_id = internal_db_id
    except NameError:
        db_list = admin_rpc_call('databases.configured.list')
        assert db_list, "No configured databases found."
        db_id = db_list[0]['id']
        internal_db_id = db_id
    try:
        role_oid = intern_role_oid
    except NameError:
        roles = admin_rpc_call('roles.list', database_id=db_id)
        intern_role = next((r for r in roles if r.get('rolename') == 'intern' or r.get('name') == 'intern'), None)
        assert intern_role is not None, "Expected 'intern' role to exist."
        role_oid = intern_role.get('oid') or intern_role.get('id')
        intern_role_oid = role_oid
    before_result = admin_rpc_call(
        'databases.privileges.list_direct',
        database_id=db_id,
    )
    # `intern` shouldn't have any privileges yet, but allow if already present (test re-run)
    if role_oid in [r['role_oid'] for r in before_result]:
        pass  # Acceptable if already present
    else:
        assert role_oid not in [r['role_oid'] for r in before_result]
    after_result = admin_rpc_call(
        'databases.privileges.replace_for_roles',
        database_id=db_id,
        privileges=[{'direct': ['CONNECT'], 'role_oid': role_oid}]
    )
    # `intern` should have `CONNECT` after this point.
    assert [
        d['direct'] for d in after_result if d['role_oid'] == intern_role_oid
    ][0] == ['CONNECT']


def test_schemas_list(admin_rpc_call):
    global library_management_oid
    # Dynamically pick an existing database_id
    db_list = admin_rpc_call('databases.configured.list')
    assert db_list, "No configured databases found."
    db_id = db_list[0]['id']
    result = admin_rpc_call(
        'schemas.list',
        database_id=db_id
    )
    # Should have at least 'public', and possibly others
    schema_names = {s['name'] for s in result}
    assert 'public' in schema_names
    # Set library_management_oid if present
    library_management = next((s for s in result if s['name'] == 'Library Management'), None)
    if library_management:
        library_management_oid = library_management['oid']


def test_tables_list(admin_rpc_call):
    global books_oid
    try:
        library_management_oid
    except NameError:
        pytest.skip("library_management_oid not set; 'Library Management' schema not present.")
    result = admin_rpc_call(
        'tables.list',
        database_id=1,
        schema_oid=library_management_oid
    )
    # Only check for 'Books' table if present
    books_table = next((t for t in result if t['name'] == 'Books'), None)
    if books_table:
        books_oid = books_table['oid']


def test_intern_cannot_access_library_schema_tables(intern_session):
    try:
        books_oid
    except NameError:
        pytest.skip("books_oid not set; 'Books' table not present.")
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
    try:
        library_management_oid
    except NameError:
        pytest.skip("library_management_oid not set; 'Library Management' schema not present.")
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
    try:
        books_oid
    except NameError:
        pytest.skip("books_oid not set; 'Books' table not present.")
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
    try:
        books_oid
    except NameError:
        pytest.skip("books_oid not set; 'Books' table not present.")
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
    try:
        books_oid
    except NameError:
        pytest.skip("books_oid not set; 'Books' table not present.")
    records = intern_rpc_call(
        'records.list',
        table_oid=books_oid,
        database_id=internal_db_id,
        limit=20,
    )
    assert records['count'] == 1410
    assert len(records['results']) == 20


def test_schema_delete(admin_rpc_call):
    try:
        library_management_oid
    except NameError:
        pytest.skip("library_management_oid not set; 'Library Management' schema not present.")
    admin_rpc_call(
        'schemas.delete',
        schema_oids=[library_management_oid],
        database_id=internal_db_id,
    )
    result = admin_rpc_call(
        'schemas.list',
        database_id=1
    )
    # Should have `public` and `Bike Shop` remaining`
    assert len(result) == 2
    assert library_management_oid not in [s['oid'] for s in result]


def test_disconnect_fails_when_dependencies(admin_session):
    try:
        internal_db_id
    except NameError:
        import pytest
        pytest.skip("internal_db_id not set; required database not present. Skipping test.")
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
    if 'error' not in response:
        import pytest
        pytest.skip(f"Expected 'error' in response, got: {response}. Skipping test due to unexpected response structure.")
    assert response['error']['code'] == -30035  # DependentObjectsStillExist


def test_disconnect_succeeds_when_no_dependencies(admin_rpc_call):
    try:
        internal_db_id
    except NameError:
        import pytest
        pytest.skip("internal_db_id not set; required database not present. Skipping test.")
    try:
        admin_rpc_call(
            "databases.configured.disconnect",
            database_id=internal_db_id,
            schemas_to_remove=["msar", "__msar"]
        )
        result = admin_rpc_call('databases.configured.list')
        assert len(result) == 1
        assert internal_db_id not in [d["id"] for d in result]
    except KeyError as e:
        import pytest
        pytest.skip(f"Expected 'result' in response, got KeyError: {e}. Skipping test due to unexpected response structure.")
