"""
Test user display utility functions.

These tests verify the functions in mathesar/utils/user_display.py which
build user display values for user-type columns.
"""
from unittest.mock import MagicMock

from mathesar.utils import user_display as ud


def _make_user(id, full_name="", email="", username=""):
    """Create a mock User object with the given fields."""
    user = MagicMock(spec=['id', 'full_name', 'email', 'username'])
    user.id = id
    user.full_name = full_name
    user.email = email
    user.username = username
    return user


def _make_column_meta(attnum, user_display_field=None, track_editing_user=False):
    """Create a mock ColumnMetaData object."""
    col = MagicMock()
    col.attnum = attnum
    col.user_display_field = user_display_field
    col.track_editing_user = track_editing_user
    return col


class TestGetUserDisplayValues:
    def test_empty_user_ids(self):
        result = ud.get_user_display_values(set(), "full_name")
        assert result == {}

    def test_single_user_full_name(self, monkeypatch):
        mock_user = _make_user(1, full_name="Alice Smith")

        def mock_filter(**kwargs):
            assert kwargs == {"id__in": {1}}
            return [mock_user]

        monkeypatch.setattr(ud.User.objects, "filter", mock_filter)
        result = ud.get_user_display_values({1}, "full_name")
        assert result == {"1": "Alice Smith"}

    def test_multiple_users_email(self, monkeypatch):
        users = [
            _make_user(1, email="alice@example.com"),
            _make_user(2, email="bob@example.com"),
        ]

        def mock_filter(**kwargs):
            assert kwargs == {"id__in": {1, 2}}
            return users

        monkeypatch.setattr(ud.User.objects, "filter", mock_filter)
        result = ud.get_user_display_values({1, 2}, "email")
        assert result == {"1": "alice@example.com", "2": "bob@example.com"}

    def test_username_field(self, monkeypatch):
        mock_user = _make_user(5, username="charlie")

        def mock_filter(**kwargs):
            return [mock_user]

        monkeypatch.setattr(ud.User.objects, "filter", mock_filter)
        result = ud.get_user_display_values({5}, "username")
        assert result == {"5": "charlie"}

    def test_missing_user_excluded(self, monkeypatch):
        """If a user_id is requested but doesn't exist, it's omitted."""
        mock_user = _make_user(1, full_name="Alice")

        def mock_filter(**kwargs):
            return [mock_user]

        monkeypatch.setattr(ud.User.objects, "filter", mock_filter)
        result = ud.get_user_display_values({1, 99}, "full_name")
        assert result == {"1": "Alice"}
        assert "99" not in result

    def test_empty_field_value(self, monkeypatch):
        """If the display field is empty, returns empty string."""
        mock_user = _make_user(1, full_name="")

        def mock_filter(**kwargs):
            return [mock_user]

        monkeypatch.setattr(ud.User.objects, "filter", mock_filter)
        result = ud.get_user_display_values({1}, "full_name")
        assert result == {"1": ""}


class TestGetUserLinkedRecordSummaries:
    def test_no_user_columns(self):
        """When no columns have user_display_field, returns None."""
        cols = [
            _make_column_meta(1, user_display_field=None),
            _make_column_meta(2, user_display_field=None),
        ]
        result = ud.get_user_linked_record_summaries(cols, [{"1": "a", "2": "b"}])
        assert result is None

    def test_single_user_column(self, monkeypatch):
        cols = [
            _make_column_meta(1, user_display_field=None),
            _make_column_meta(3, user_display_field="full_name"),
        ]
        results = [
            {"1": "foo", "3": 10},
            {"1": "bar", "3": 20},
        ]

        def mock_get_user_display_values(user_ids, display_field):
            assert user_ids == {10, 20}
            assert display_field == "full_name"
            return {"10": "Alice", "20": "Bob"}

        monkeypatch.setattr(ud, "get_user_display_values", mock_get_user_display_values)
        result = ud.get_user_linked_record_summaries(cols, results)
        assert result == {"3": {"10": "Alice", "20": "Bob"}}

    def test_multiple_user_columns(self, monkeypatch):
        cols = [
            _make_column_meta(2, user_display_field="email"),
            _make_column_meta(5, user_display_field="username"),
        ]
        results = [
            {"2": 1, "5": 3},
            {"2": 2, "5": 3},
        ]

        call_log = []

        def mock_get_user_display_values(user_ids, display_field):
            call_log.append((user_ids, display_field))
            if display_field == "email":
                return {"1": "a@b.com", "2": "c@d.com"}
            elif display_field == "username":
                return {"3": "charlie"}
            return {}

        monkeypatch.setattr(ud, "get_user_display_values", mock_get_user_display_values)
        result = ud.get_user_linked_record_summaries(cols, results)
        assert result == {
            "2": {"1": "a@b.com", "2": "c@d.com"},
            "5": {"3": "charlie"},
        }

    def test_null_values_in_results(self, monkeypatch):
        """Null user IDs in results should be skipped."""
        cols = [_make_column_meta(3, user_display_field="full_name")]
        results = [
            {"3": 10},
            {"3": None},
            {"3": 20},
        ]

        def mock_get_user_display_values(user_ids, display_field):
            assert user_ids == {10, 20}
            return {"10": "Alice", "20": "Bob"}

        monkeypatch.setattr(ud, "get_user_display_values", mock_get_user_display_values)
        result = ud.get_user_linked_record_summaries(cols, results)
        assert result == {"3": {"10": "Alice", "20": "Bob"}}

    def test_string_attnum_keys_in_results(self, monkeypatch):
        """Results may have string keys for attnums."""
        cols = [_make_column_meta(3, user_display_field="full_name")]
        results = [{"3": 10}]

        def mock_get_user_display_values(user_ids, display_field):
            assert user_ids == {10}
            return {"10": "Alice"}

        monkeypatch.setattr(ud, "get_user_display_values", mock_get_user_display_values)
        result = ud.get_user_linked_record_summaries(cols, results)
        assert result == {"3": {"10": "Alice"}}

    def test_returns_none_when_no_user_values(self, monkeypatch):
        """If all user columns have null values in results, returns None."""
        cols = [_make_column_meta(3, user_display_field="full_name")]
        results = [{"3": None}]

        result = ud.get_user_linked_record_summaries(cols, results)
        assert result is None


class TestApplyTrackEditingUser:
    def test_no_tracking_columns(self):
        cols = [
            _make_column_meta(1, user_display_field="full_name", track_editing_user=False),
            _make_column_meta(2, user_display_field=None, track_editing_user=False),
        ]
        record_def = {"1": "some_value"}
        result = ud.apply_track_editing_user(record_def, cols, 42)
        assert result == {"1": "some_value"}

    def test_single_tracking_column(self):
        cols = [
            _make_column_meta(1, user_display_field=None, track_editing_user=False),
            _make_column_meta(5, user_display_field="full_name", track_editing_user=True),
        ]
        record_def = {"1": "some_value"}
        result = ud.apply_track_editing_user(record_def, cols, 42)
        assert result == {"1": "some_value", "5": 42}

    def test_multiple_tracking_columns(self):
        cols = [
            _make_column_meta(2, user_display_field="email", track_editing_user=True),
            _make_column_meta(7, user_display_field="username", track_editing_user=True),
        ]
        record_def = {"1": "data"}
        result = ud.apply_track_editing_user(record_def, cols, 99)
        assert result == {"1": "data", "2": 99, "7": 99}

    def test_does_not_mutate_original(self):
        cols = [
            _make_column_meta(3, user_display_field="full_name", track_editing_user=True),
        ]
        record_def = {"1": "original"}
        result = ud.apply_track_editing_user(record_def, cols, 10)
        assert result == {"1": "original", "3": 10}
        assert record_def == {"1": "original"}

    def test_requires_user_display_field(self):
        """track_editing_user without user_display_field should not apply."""
        cols = [
            _make_column_meta(3, user_display_field=None, track_editing_user=True),
        ]
        record_def = {"1": "data"}
        result = ud.apply_track_editing_user(record_def, cols, 42)
        assert result == {"1": "data"}

    def test_overwrites_existing_value(self):
        """If the record already has a value for the tracking column, overwrite it."""
        cols = [
            _make_column_meta(3, user_display_field="full_name", track_editing_user=True),
        ]
        record_def = {"1": "data", "3": 999}
        result = ud.apply_track_editing_user(record_def, cols, 42)
        assert result == {"1": "data", "3": 42}
