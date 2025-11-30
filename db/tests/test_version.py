"""
Tests for PostgreSQL version checking utilities.
"""

import pytest
from db.version import (
    get_postgres_version,
    is_postgres_version_deprecated,
    get_deprecation_message,
    DEPRECATED_POSTGRES_VERSIONS,
)


class TestPostgresVersionChecking:
    """Tests for PostgreSQL version detection and deprecation checking."""

    def test_is_postgres_version_deprecated_with_deprecated_version(self):
        """Test that deprecated versions are correctly identified."""
        # PostgreSQL 13 should be deprecated
        assert is_postgres_version_deprecated(13) is True

    def test_is_postgres_version_deprecated_with_supported_version(self):
        """Test that supported versions are not marked as deprecated."""
        # PostgreSQL 14 should not be deprecated
        assert is_postgres_version_deprecated(14) is False
        assert is_postgres_version_deprecated(15) is False
        assert is_postgres_version_deprecated(16) is False

    def test_get_deprecation_message_for_deprecated_version(self):
        """Test that deprecation message is returned for deprecated versions."""
        message = get_deprecation_message(13)
        assert message is not None
        assert "PostgreSQL 13" in message
        assert "no longer supported" in message

    def test_get_deprecation_message_for_supported_version(self):
        """Test that None is returned for supported versions."""
        message = get_deprecation_message(14)
        assert message is None

    def test_deprecated_versions_contain_expected_versions(self):
        """Test that deprecated versions dictionary contains expected versions."""
        assert 13 in DEPRECATED_POSTGRES_VERSIONS
        assert "message" in DEPRECATED_POSTGRES_VERSIONS[13]
        assert "deprecated_since" in DEPRECATED_POSTGRES_VERSIONS[13]


@pytest.mark.django_db
class TestGetPostgresVersion:
    """Tests for retrieving PostgreSQL version from a connection."""

    def test_get_postgres_version_returns_version_info(self, admin_conn):
        """Test that get_postgres_version returns proper version info."""
        version_info = get_postgres_version(admin_conn)

        # Check that all required fields are present
        assert "version_string" in version_info
        assert "version_number" in version_info
        assert "major_version" in version_info
        assert "minor_version" in version_info
        assert "is_deprecated" in version_info
        assert "deprecation_message" in version_info

        # Check that version numbers are reasonable
        assert isinstance(version_info["version_number"], int)
        assert version_info["version_number"] > 0
        assert isinstance(version_info["major_version"], int)
        assert version_info["major_version"] >= 13

    def test_get_postgres_version_deprecation_field(self, admin_conn):
        """Test that deprecation status is correctly determined."""
        version_info = get_postgres_version(admin_conn)

        # Check deprecation status matches expected
        is_deprecated = version_info["is_deprecated"]
        major_version = version_info["major_version"]

        if major_version == 13:
            assert is_deprecated is True
            assert version_info["deprecation_message"] is not None
        else:
            assert is_deprecated is False
            assert version_info["deprecation_message"] is None
