# PostgreSQL Deprecation Warnings - Quick Start Guide

## Installation & Setup

### 1. Backend Setup (Already Included)

The backend files are already in place:
- ✅ `db/version.py` - Version detection
- ✅ `mathesar/utils/database_warnings.py` - Warning collection
- ✅ `mathesar/rpc/databases/base.py` - Updated with RPC methods

No additional installation required!

### 2. Frontend Integration

Add the deprecation warnings component to your main app layout:

```svelte
<!-- In your main App.svelte or a layout component -->
<script>
  import DeprecationWarnings from '@mathesar/components/DeprecationWarnings.svelte';
</script>

<div class="app">
  <DeprecationWarnings />
  <!-- Rest of your app -->
</div>
```

## Configuration

### Set PostgreSQL 13 as Deprecated (Default)

Already configured in `db/version.py`:

```python
DEPRECATED_POSTGRES_VERSIONS = {
    13: {
        "deprecated_since": "0.8.0",
        "message": "PostgreSQL 13 is no longer supported. Please upgrade to PostgreSQL 14 or higher."
    }
}
```

### Add More Deprecated Versions

Edit `db/version.py` and add to the dictionary:

```python
DEPRECATED_POSTGRES_VERSIONS = {
    13: {...},
    12: {
        "deprecated_since": "0.7.0",
        "message": "PostgreSQL 12 is no longer supported. Please upgrade to PostgreSQL 13 or higher."
    }
}
```

### Change Minimum Supported Version

Edit `db/version.py`:

```python
MINIMUM_SUPPORTED_VERSION = 15  # or whatever version
```

## Testing

### Run All Tests

```bash
# Backend tests
pytest db/tests/test_version.py
pytest mathesar/tests/test_database_warnings.py
pytest mathesar/rpc/databases/test_base.py  # If RPC tests exist
```

### Manual Testing

#### 1. Test Version Detection

```python
from db.version import get_postgres_version, is_postgres_version_deprecated
from mathesar.models.base import Database

# Get a database connection
db = Database.objects.first()
with db.connect_admin() as conn:
    info = get_postgres_version(conn)
    print(f"PostgreSQL {info['major_version']}")
    print(f"Is deprecated: {info['is_deprecated']}")
    print(f"Message: {info['deprecation_message']}")
```

#### 2. Test RPC API

Use curl or Postman to call the RPC endpoints:

```bash
# Get warnings for specific database
curl -X POST http://localhost:8000/api/rpc/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "databases.get_deprecation_warnings",
    "params": {"database_id": 1},
    "id": 1
  }'

# Get all warnings for user
curl -X POST http://localhost:8000/api/rpc/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "databases.get_all_deprecation_warnings",
    "params": {},
    "id": 2
  }'
```

#### 3. Test Frontend Component

1. Add to a page in your app
2. Open browser DevTools
3. Check console for any errors
4. Should see warnings if connected to PostgreSQL 13

## Usage Examples

### Backend: Check if Database is Deprecated

```python
from db.version import is_postgres_version_deprecated
from mathesar.models.base import Database

database = Database.objects.get(id=1)
with database.connect_admin() as conn:
    cursor = conn.execute("SHOW server_version_num")
    version = int(cursor.fetchone()[0])
    major_version = version // 10000
    
    if is_postgres_version_deprecated(major_version):
        print("This database should be upgraded!")
```

### Frontend: Get Warnings in Component

```svelte
<script>
  import { postgresDeprecationWarnings } from '@mathesar/stores/deprecationWarnings';
</script>

{#each $postgresDeprecationWarnings as warning}
  <div class="warning">
    <strong>{warning.database_name}</strong>
    <p>{warning.warning_message}</p>
  </div>
{/each}
```

### Frontend: Programmatically Refresh

```svelte
<script>
  import { deprecationWarnings } from '@mathesar/stores/deprecationWarnings';
  
  async function checkWarnings() {
    await deprecationWarnings.refresh();
    console.log('Warnings updated');
  }
</script>

<button on:click={checkWarnings}>Check for Deprecation Warnings</button>
```

## Troubleshooting

### Warnings Not Showing

1. **Check backend is running**
   ```bash
   # Verify Django is running
   curl http://localhost:8000/
   ```

2. **Check frontend component is mounted**
   ```javascript
   // In browser console
   console.log('Checking if component is present')
   ```

3. **Check database connection**
   ```bash
   # Test PostgreSQL connection
   psql -h localhost -U user -d database
   ```

4. **Enable debug logging**
   ```python
   # In settings/development.py
   LOGGING = {
       'version': 1,
       'handlers': {
           'console': {'class': 'logging.StreamHandler'},
       },
       'loggers': {
           'mathesar.utils.database_warnings': {
               'handlers': ['console'],
               'level': 'DEBUG',
           }
       }
   }
   ```

### Incorrect Version Detection

- Verify PostgreSQL version: `SELECT version();`
- Check SHOW commands work: `SHOW server_version_num;`
- Verify configuration in `db/version.py`

### RPC Errors

- Check authentication headers
- Verify RPC endpoint URL
- Check network connectivity
- Review server logs for details

## Next Steps

### Integrate Into UI

1. **Dashboard**: Show warnings on landing page
2. **Database List**: Show warning badge next to deprecated databases
3. **Database Detail**: Display warnings prominently
4. **Settings**: Add admin panel for deprecation policy

### Add User Features

1. **Dismissal**: Allow users to dismiss warnings
2. **Reminders**: Show reminders after dismissed
3. **Email**: Send email notifications to admins
4. **Tracking**: Track when warnings were first shown

### Extend to Other Types

1. **Python Version**: Warn about deprecated Python versions
2. **Browser Support**: Warn about unsupported browsers
3. **Feature Deprecation**: Warn about deprecated features
4. **License**: Warn about expiring licenses

## Documentation Files

- **DEPRECATION_WARNINGS.md** - Complete feature documentation
- **DEPRECATION_WARNINGS_EXAMPLES.md** - Code examples
- **ARCHITECTURE.md** - System architecture and design
- **IMPLEMENTATION_SUMMARY.md** - What was implemented

## Files Created

**Backend:**
- `/db/version.py` - Version checking utilities
- `/mathesar/utils/database_warnings.py` - Warning collection
- `/db/tests/test_version.py` - Backend tests
- `/mathesar/tests/test_database_warnings.py` - Integration tests

**Frontend:**
- `/mathesar_ui/src/stores/deprecationWarnings.ts` - Svelte store
- `/mathesar_ui/src/components/DeprecationWarnings.svelte` - Main component
- `/mathesar_ui/src/components/message-boxes/DeprecationWarningBox.svelte` - Warning display

**Modified:**
- `/mathesar/rpc/databases/base.py` - Added RPC methods

**Documentation:**
- `/DEPRECATION_WARNINGS.md`
- `/DEPRECATION_WARNINGS_EXAMPLES.md`
- `/ARCHITECTURE.md`
- `/IMPLEMENTATION_SUMMARY.md`

## Support

For issues or questions:
1. Check the documentation files
2. Review the examples
3. Check test cases for usage patterns
4. Review application logs for errors

## Version Information

- Implemented for: GitHub Issue #4882
- PostgreSQL 13 deprecated in: Mathesar 0.8.0
- Minimum supported version: PostgreSQL 14
- Implementation date: 2024
