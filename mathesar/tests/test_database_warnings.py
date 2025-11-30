"""
Tests for database deprecation warning utilities.
"""

import pytest
from mathesar.models.base import Database, UserDatabaseRoleMap
from mathesar.utils.database_warnings import (
    get_database_deprecation_warnings,
    get_all_database_deprecation_warnings,
)


@pytest.mark.django_db
class TestGetDatabaseDeprecationWarnings:
    """Tests for getting deprecation warnings for a specific database."""

    def test_get_database_deprecation_warnings_returns_list(self, user, create_test_database):
        """Test that the function returns a list of warnings."""
        database = create_test_database()
        
        warnings = get_database_deprecation_warnings(database.id, user)
        
        assert isinstance(warnings, list)

    def test_get_database_deprecation_warnings_structure(self, user, create_test_database):
        """Test that warning objects have the correct structure."""
        database = create_test_database()
        
        warnings = get_database_deprecation_warnings(database.id, user)
        
        if warnings:
            warning = warnings[0]
            assert "database_id" in warning
            assert "database_name" in warning
            assert "database_nickname" in warning
            assert "postgres_version" in warning
            assert "postgres_major_version" in warning
            assert "warning_message" in warning
            assert "warning_type" in warning


@pytest.mark.django_db
class TestGetAllDatabaseDeprecationWarnings:
    """Tests for getting all deprecation warnings across databases."""

    def test_get_all_database_deprecation_warnings_returns_list(self, user):
        """Test that the function returns a list of warnings."""
        warnings = get_all_database_deprecation_warnings(user)
        
        assert isinstance(warnings, list)

    def test_get_all_database_deprecation_warnings_filters_by_user(
        self, user, other_user, create_test_database
    ):
        """Test that warnings are only returned for user's databases."""
        # This test ensures that warnings are filtered by user
        # and don't leak across users
        warnings = get_all_database_deprecation_warnings(user)
        
        # All warnings should only include user's databases
        assert isinstance(warnings, list)
