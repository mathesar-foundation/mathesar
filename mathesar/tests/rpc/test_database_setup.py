"""
This file tests the database_setup RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from mathesar.models.users import User
from mathesar.models.base import Database, ConfiguredRole, Server, UserDatabaseRoleMap
from mathesar.rpc.databases import configured as configured_databases
from mathesar.rpc.databases import setup as database_setup
from mathesar.rpc.roles import configured as configured_roles
from mathesar.rpc.servers import configured as configured_servers


def test_create_new(monkeypatch, rf):
    test_sample_data = ["library_management"]
    test_database = "mathesar42"
    request = rf.post("/api/rpc/v0/", data={})
    request.user = User(username="alice", password="pass1234")
    server_model = Server(id=2, host="example.com", port=5432)
    db_model = Database(id=3, name=test_database, server=server_model)
    role_model = ConfiguredRole(id=4, name="matheuser", server=server_model)

    def mock_set_up_new_for_user(database, user, sample_data=[]):
        if not (
                database == test_database
                and user == request.user
                and sample_data == test_sample_data
        ):
            raise AssertionError("incorrect parameters passed")
        return UserDatabaseRoleMap(
            user=user, database=db_model, configured_role=role_model, server=server_model
        )

    monkeypatch.setattr(
        database_setup.permissions,
        "set_up_new_database_for_user_on_internal_server",
        mock_set_up_new_for_user,
    )
    expect_response = database_setup.DatabaseConnectionResult(
        server=configured_servers.ConfiguredServerInfo.from_model(server_model),
        database=configured_databases.ConfiguredDatabaseInfo.from_model(db_model),
        configured_role=configured_roles.ConfiguredRoleInfo.from_model(role_model)
    )

    actual_response = database_setup.create_new(
        database=test_database, sample_data=test_sample_data, request=request
    )
    assert actual_response == expect_response


def test_connect_existing(monkeypatch, rf):
    test_sample_data = ["library_management"]
    test_database = "mathesar42"
    test_host = "example.com"
    test_port = 6543
    test_role = "ernie"
    test_password = "ernie1234"
    request = rf.post("/api/rpc/v0/", data={})
    request.user = User(username="alice", password="pass1234")
    server_model = Server(id=2, host="example.com", port=5432)
    db_model = Database(id=3, name=test_database, server=server_model)
    role_model = ConfiguredRole(id=4, name="matheuser", server=server_model)

    def mock_set_up_preexisting_database_for_user(
            host, port, database_name, role_name, password, user, sample_data=[]
    ):
        if not (
                host == test_host
                and port == test_port
                and database_name == test_database
                and role_name == test_role
                and password == test_password
                and user == request.user
                and sample_data == test_sample_data
        ):
            raise AssertionError("incorrect parameters passed")
        return UserDatabaseRoleMap(
            user=user, database=db_model, configured_role=role_model, server=server_model
        )

    monkeypatch.setattr(
        database_setup.permissions,
        "set_up_preexisting_database_for_user",
        mock_set_up_preexisting_database_for_user,
    )
    expect_response = database_setup.DatabaseConnectionResult(
        server=configured_servers.ConfiguredServerInfo.from_model(server_model),
        database=configured_databases.ConfiguredDatabaseInfo.from_model(db_model),
        configured_role=configured_roles.ConfiguredRoleInfo.from_model(role_model)
    )

    actual_response = database_setup.connect_existing(
        host=test_host, port=test_port, database=test_database, role=test_role,
        password=test_password, sample_data=test_sample_data, request=request
    )
    assert actual_response == expect_response
