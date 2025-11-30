# PostgreSQL Deprecation Warnings Implementation

This document describes the implementation of in-app deprecation warnings for PostgreSQL versions in Mathesar.

## Overview

Mathesar now notifies users when their connected databases are running PostgreSQL versions that are reaching end-of-life support or are no longer supported by the current version of Mathesar.

## Configuration

### Deprecated Versions

Deprecated PostgreSQL versions are defined in `/home/ashwath/mathesar/db/version.py`:

```python
DEPRECATED_POSTGRES_VERSIONS = {
    13: {
        "deprecated_since": "0.8.0",
        "message": "PostgreSQL 13 is no longer supported. Please upgrade to PostgreSQL 14 or higher."
    }
}
```

To add or modify deprecated versions, update this dictionary. The key should be the PostgreSQL major version number, and the value should contain:
- `deprecated_since`: The Mathesar version that dropped support
- `message`: The deprecation message shown to users

The minimum supported version is defined by:
```python
MINIMUM_SUPPORTED_VERSION = 14
```

## Backend Implementation

### PostgreSQL Version Detection (`db/version.py`)

- **`get_postgres_version(conn)`**: Retrieves version information from a database connection
  - Returns a `PostgresVersionInfo` dictionary with version details and deprecation status
  - Queries `SHOW server_version_num` and `SHOW server_version` from PostgreSQL

- **`is_postgres_version_deprecated(major_version)`**: Checks if a version is deprecated

- **`get_deprecation_message(major_version)`**: Retrieves the deprecation message for a version

### Database Warnings (`mathesar/utils/database_warnings.py`)

- **`get_database_deprecation_warnings(database_id, user)`**: Gets warnings for a specific database
- **`get_all_database_deprecation_warnings(user)`**: Gets all warnings for a user's databases
- **`get_internal_database_deprecation_warnings(database_id)`**: Gets warnings using admin connection

### RPC API (`mathesar/rpc/databases/base.py`)

Two new RPC methods are exposed:

1. **`databases.get_deprecation_warnings`** (requires login)
   - Parameters: `database_id` (Django database ID)
   - Returns: List of deprecation warnings for that database

2. **`databases.get_all_deprecation_warnings`** (requires login)
   - Parameters: None
   - Returns: List of all deprecation warnings for the user's databases

## Frontend Implementation

### Store (`mathesar_ui/src/stores/deprecationWarnings.ts`)

- **`deprecationWarnings`**: Main store containing all deprecation warnings
- **`postgresDeprecationWarnings`**: Derived store filtering for PostgreSQL-specific warnings
- **`hasDeprecationWarnings`**: Derived store indicating if any warnings exist

### Components

1. **`DeprecationWarningBox.svelte`**: Displays individual warning with database and version info
2. **`DeprecationWarnings.svelte`**: Main component that displays all warnings

### Usage

```svelte
<script>
  import DeprecationWarnings from '@mathesar/components/DeprecationWarnings.svelte';
</script>

<DeprecationWarnings />
```

The component automatically fetches warnings on mount and displays them.

## Testing

### Backend Tests

**`db/tests/test_version.py`**: Tests for version checking utilities
- Version deprecation status checking
- Deprecation message retrieval
- Version info parsing

**`mathesar/tests/test_database_warnings.py`**: Tests for database warning utilities
- Warning generation for databases
- User-specific warning filtering

### Running Tests

```bash
pytest db/tests/test_version.py
pytest mathesar/tests/test_database_warnings.py
```

## Integration Points

### Where Warnings Can Be Displayed

1. **Dashboard**: Display warnings prominently on the main dashboard
2. **Database Detail Page**: Show warnings when viewing a specific database
3. **Header/Navbar**: Show warning indicator or badge
4. **Setup Wizard**: Alert users during database setup if connecting to a deprecated version

### Example Integration

```svelte
<!-- In a page component -->
<script>
  import DeprecationWarnings from '@mathesar/components/DeprecationWarnings.svelte';
</script>

<div class="page">
  <DeprecationWarnings />
  <!-- rest of page content -->
</div>
```

## Future Enhancements

1. **Persistent Dismissal**: Allow users to dismiss warnings (with reminder after upgrade)
2. **Email Notifications**: Send deprecation warning emails to admin users
3. **Configurable Thresholds**: Allow admins to set custom deprecation policies
4. **Multiple Warning Types**: Extend to warn about other deprecations (Python versions, browser compatibility, etc.)
5. **Upgrade Guidance**: Provide links to upgrade documentation
6. **Analytics**: Track warning display and user interactions

## Database Queries Used

The implementation uses these PostgreSQL queries:
- `SHOW server_version_num` - Returns PostgreSQL version as a number (e.g., 130000 for v13)
- `SHOW server_version` - Returns PostgreSQL version as a string (e.g., "13.5 (Debian 13.5-1.pgdg100+1)")

## Error Handling

If a connection cannot be established to a database:
- The function gracefully handles the exception
- No warning is displayed
- The error is silently caught to avoid breaking the UI

This ensures that connection issues don't prevent the application from loading.

## Security Considerations

1. **User Authorization**: Only users with access to a database can see warnings for that database
2. **Information Disclosure**: Version information is already visible through normal queries, so this doesn't introduce new information disclosure
3. **No Sensitive Data**: Warnings only contain database name, nickname, and version information

## Migration Guide

### For Admins

1. Monitor deprecation warnings in the UI
2. Plan PostgreSQL upgrades according to the deprecation timeline
3. Test upgrades in a staging environment first
4. Update PostgreSQL on production databases

### For Users

1. Check deprecation warnings when you see them
2. Contact your database administrator about upgrades
3. Coordinate with your team on upgrade timing

## Related Issues

- GitHub Issue: #4882 - Add in-app deprecation warnings for PostgreSQL
