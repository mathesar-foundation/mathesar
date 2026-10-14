"""
This file tests the users RPC functions.

Fixtures:
    rf(pytest-django): Provides mocked `Request` objects.
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
import pytest

from mathesar.rpc import users
from mathesar.models.users import User


def test_users_list(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')

    def mock_list_users():
        return [
            User(
                id=1,
                username='alice',
                is_superuser=True,
                email='alice@mathesar.org',
                full_name='Alice Liddell',
                display_language='en'
            ),
            User(
                id=2,
                username='bob',
                is_superuser=False,
                email='bob@mathesar.org',
                full_name='Bob Marley',
                display_language='ja'
            )
        ]
    monkeypatch.setattr(users, 'list_users', mock_list_users)
    expected_users_list = [
        {
            'id': 1,
            'username': 'alice',
            'is_superuser': True,
            'email': 'alice@mathesar.org',
            'full_name': 'Alice Liddell',
            'display_language': 'en'
        },
        {
            'id': 2,
            'username': 'bob',
            'is_superuser': False,
            'email': 'bob@mathesar.org',
            'full_name': 'Bob Marley',
            'display_language': 'ja'
        }
    ]
    actual_users_list = users.list_()
    assert actual_users_list == expected_users_list


def test_users_get(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    user_id = 1

    def mock_get_user(_user_id):
        if _user_id != user_id:
            raise AssertionError('incorrect parameters passed')
        return User(
            id=1,
            username='alice',
            is_superuser=True,
            email='alice@mathesar.org',
            full_name='Alice Liddell',
            display_language='en'
        )
    monkeypatch.setattr(users, 'get_user', mock_get_user)
    expected_user_info = {
        'id': 1,
        'username': 'alice',
        'is_superuser': True,
        'email': 'alice@mathesar.org',
        'full_name': 'Alice Liddell',
        'display_language': 'en'
    }
    actual_user_info = users.get(user_id=user_id)
    assert actual_user_info == expected_user_info


def test_users_add(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    user_def = {
        'username': 'Bob',
        'password': 'bobspassword',
        'is_superuser': False,
        'email': 'bob@mathesar.org',
        'full_name': 'Bob Marley',
        'display_language': 'en'
    }

    def mock_add_user(_user_def):
        if _user_def != user_def:
            raise AssertionError('incorrect parameters passed')
        return User(
            id=2,
            username='Bob',
            is_superuser=False,
            email='bob@mathesar.org',
            full_name='Bob Marley',
            display_language='en'
        )
    monkeypatch.setattr(users, 'add_user', mock_add_user)
    expected_user_info = {
        'id': 2,
        'username': 'Bob',
        'is_superuser': False,
        'email': 'bob@mathesar.org',
        'full_name': 'Bob Marley',
        'display_language': 'en'
    }
    actual_user_info = users.add(user_def=user_def)
    assert actual_user_info == expected_user_info


def test_users_delete(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(username='alice', password='pass1234')
    user_id = 2

    def mock_delete_user(_user_id):
        if _user_id != user_id:
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(users, 'delete_user', mock_delete_user)
    users.delete(user_id=user_id)


def test_users_patch_self(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(id=2, username='alice', password='pass1234')
    _user_id = 2
    _username = 'alice_liddell'
    _email = 'alice@mathesar.org'
    _full_name = 'Alice liddell'
    _display_language = 'en'

    def mock_patch_self(user_id, username, email, full_name, display_language):
        if (
            _user_id != user_id
            and _username != username
            and _email != email
            and _full_name != full_name
            and _display_language != display_language
        ):
            raise AssertionError('incorrect parameters passed')
        return User(
            id=2,
            username='alice_liddell',
            is_superuser=False,
            email='alice@mathesar.org',
            full_name='Alice liddell',
            display_language='en'
        )
    monkeypatch.setattr(users, 'update_self_user_info', mock_patch_self)
    expected_user_info = {
        'id': 2,
        'username': 'alice_liddell',
        'is_superuser': False,
        'email': 'alice@mathesar.org',
        'full_name': 'Alice liddell',
        'display_language': 'en'
    }
    actual_user_info = users.patch_self(
        username=_username,
        email=_email,
        full_name=_full_name,
        display_language=_display_language,
        request=request
    )
    assert actual_user_info == expected_user_info


def test_users_other(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(id=1, username='alice', password='pass1234')
    _user_id = 2
    _username = 'bob_marley'
    _is_superuser = False
    _email = 'bobm@mathesar.org'
    _full_name = 'bob Marley'
    _display_language = 'ja'

    def mock_patch_other(user_id, username, is_superuser, email, full_name, display_language):
        if (
            _user_id != user_id
            and _username != username
            and _is_superuser != is_superuser
            and _email != email
            and _full_name != full_name
            and _display_language != display_language
        ):
            raise AssertionError('incorrect parameters passed')
        return User(
            id=2,
            username='bob_marley',
            is_superuser=False,
            email='bobm@mathesar.org',
            full_name='bob Marley',
            display_language='ja'
        )
    monkeypatch.setattr(users, 'update_other_user_info', mock_patch_other)
    expected_user_info = {
        'id': 2,
        'username': 'bob_marley',
        'is_superuser': False,
        'email': 'bobm@mathesar.org',
        'full_name': 'bob Marley',
        'display_language': 'ja'
    }
    actual_user_info = users.patch_other(
        user_id=_user_id,
        username=_username,
        is_superuser=_is_superuser,
        email=_email,
        full_name=_full_name,
        display_language=_display_language
    )
    assert actual_user_info == expected_user_info


def test_users_replace_own(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(id=2, username='bob', password='bobs_old_password')
    request.user.set_password('bobs_old_password')
    _user_id = 2
    _old_password = 'bobs_old_password'
    _new_password = 'bobs_new_password'

    def mock_change_password(user_id, new_password):
        if (
            _user_id != user_id
            and _new_password != new_password
        ):
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(users, 'change_password', mock_change_password)
    users.replace_own(old_password=_old_password, new_password=_new_password, request=request)


def test_users_revoke(rf, monkeypatch):
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(id=1, username='alice', password='pass1234')
    _user_id = 3
    _new_password = 'bobs_new_password'

    def mock_revoke_password(user_id, new_password):
        if (
            _user_id != user_id
            and _new_password != new_password
        ):
            raise AssertionError('incorrect parameters passed')

    monkeypatch.setattr(users, 'revoke', mock_revoke_password)
    users.revoke(user_id=_user_id, new_password=_new_password)


def test_users_replace_own_blocked_when_sso_required(rf, settings, monkeypatch):
    settings.REQUIRE_SSO_LOGIN = True
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(id=2, username='bob', password='bobs_old_password')
    request.user.set_password('bobs_old_password')

    def mock_change_password(user_id, new_password):
        raise AssertionError('change_password should not be called')

    monkeypatch.setattr(users, 'change_password', mock_change_password)
    with pytest.raises(Exception, match='Password authentication is disabled'):
        users.replace_own(
            old_password='bobs_old_password',
            new_password='bobs_new_password',
            request=request,
        )


def test_users_revoke_still_works_when_sso_required(rf, settings, monkeypatch):
    settings.REQUIRE_SSO_LOGIN = True
    called = {}

    def mock_revoke_password(user_id, new_password):
        called['args'] = (user_id, new_password)

    monkeypatch.setattr(users, 'revoke_password', mock_revoke_password)
    users.revoke(user_id=3, new_password='new')
    assert called['args'] == (3, 'new')


def test_users_patch_self_email_change_blocked_when_sso_required(rf, settings, monkeypatch):
    settings.REQUIRE_SSO_LOGIN = True
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(id=2, username='alice', email='alice@mathesar.org')

    def mock_patch_self(*args, **kwargs):
        raise AssertionError('update_self_user_info should not be called')

    monkeypatch.setattr(users, 'update_self_user_info', mock_patch_self)
    with pytest.raises(Exception, match='Email cannot be changed'):
        users.patch_self(
            username='alice',
            email='new@mathesar.org',
            full_name='Alice',
            display_language='en',
            request=request,
        )


def test_users_patch_self_same_email_allowed_when_sso_required(rf, settings, monkeypatch):
    settings.REQUIRE_SSO_LOGIN = True
    request = rf.post('/api/rpc/v0', data={})
    request.user = User(id=2, username='alice', email='alice@mathesar.org')

    def mock_patch_self(user_id, username, email, full_name, display_language):
        return User(
            id=2,
            username=username,
            is_superuser=False,
            email=email,
            full_name=full_name,
            display_language=display_language,
        )

    monkeypatch.setattr(users, 'update_self_user_info', mock_patch_self)
    result = users.patch_self(
        username='alice_l',
        email='alice@mathesar.org',
        full_name='Alice L',
        display_language='en',
        request=request,
    )
    assert result['email'] == 'alice@mathesar.org'
    assert result['full_name'] == 'Alice L'


def test_users_patch_other_email_change_allowed_when_sso_required(rf, settings, monkeypatch):
    settings.REQUIRE_SSO_LOGIN = True
    called = {}

    def mock_patch_other(user_id, username, is_superuser, email, full_name, display_language):
        called['email'] = email
        return User(
            id=user_id,
            username=username,
            is_superuser=is_superuser,
            email=email,
            full_name=full_name,
            display_language=display_language,
        )

    monkeypatch.setattr(users, 'update_other_user_info', mock_patch_other)
    users.patch_other(
        user_id=3,
        username='bob',
        is_superuser=False,
        email='changed@mathesar.org',
        full_name='Bob',
        display_language='en',
    )
    assert called['email'] == 'changed@mathesar.org'
