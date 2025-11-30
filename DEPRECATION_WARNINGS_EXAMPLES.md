# PostgreSQL Deprecation Warnings - Usage Examples

## Backend Usage

### Python: Checking if a version is deprecated

```python
from db.version import is_postgres_version_deprecated, get_deprecation_message

# Check if PostgreSQL 13 is deprecated
if is_postgres_version_deprecated(13):
    print(get_deprecation_message(13))
    # Output: PostgreSQL 13 is no longer supported. Please upgrade to PostgreSQL 14 or higher.
```

### Python: Getting version info from a connection

```python
from db.version import get_postgres_version
from mathesar.models.base import Database

database = Database.objects.get(id=1)
with database.connect_admin() as conn:
    version_info = get_postgres_version(conn)
    print(f"Version: {version_info['version_string']}")
    print(f"Major: {version_info['major_version']}")
    print(f"Deprecated: {version_info['is_deprecated']}")
    if version_info['is_deprecated']:
        print(f"Warning: {version_info['deprecation_message']}")
```

### Python: Getting warnings for a database

```python
from mathesar.utils.database_warnings import get_database_deprecation_warnings
from django.contrib.auth.models import User

user = User.objects.get(username='john')
warnings = get_database_deprecation_warnings(database_id=1, user=user)

for warning in warnings:
    print(f"Database: {warning['database_name']}")
    print(f"Version: {warning['postgres_version']}")
    print(f"Message: {warning['warning_message']}")
```

### Python: Getting all warnings for a user

```python
from mathesar.utils.database_warnings import get_all_database_deprecation_warnings
from django.contrib.auth.models import User

user = User.objects.get(username='john')
all_warnings = get_all_database_deprecation_warnings(user)

print(f"Total deprecation warnings: {len(all_warnings)}")
for warning in all_warnings:
    print(f"  - {warning['database_nickname'] or warning['database_name']}: PostgreSQL {warning['postgres_major_version']}")
```

## RPC/API Usage

### JavaScript/TypeScript: Fetching warnings

```typescript
import { api } from '@mathesar/api/rpc';

// Get warnings for a specific database
const dbWarnings = await api.databases.get_deprecation_warnings({ 
  database_id: 1 
});

// Get all warnings for current user
const allWarnings = await api.databases.get_all_deprecation_warnings();

console.log(allWarnings);
// Output:
// [
//   {
//     database_id: 1,
//     database_name: "production",
//     database_nickname: "Main DB",
//     postgres_version: "13.5 (Debian 13.5-1.pgdg100+1)",
//     postgres_major_version: 13,
//     warning_message: "PostgreSQL 13 is no longer supported...",
//     warning_type: "postgres_version"
//   }
// ]
```

## Frontend Usage (Svelte)

### Basic: Display all warnings

```svelte
<script>
  import DeprecationWarnings from '@mathesar/components/DeprecationWarnings.svelte';
</script>

<div class="page">
  <DeprecationWarnings />
  <!-- Rest of page content -->
</div>
```

### Advanced: Custom handling with store

```svelte
<script>
  import { 
    deprecationWarnings, 
    postgresDeprecationWarnings,
    hasDeprecationWarnings 
  } from '@mathesar/stores/deprecationWarnings';
  import { onMount } from 'svelte';
  
  onMount(async () => {
    await deprecationWarnings.refresh();
  });
</script>

{#if $hasDeprecationWarnings}
  <div class="warning-banner">
    <p>You have {$postgresDeprecationWarnings.length} deprecation warning(s)</p>
    
    {#each $postgresDeprecationWarnings as warning (warning.database_id)}
      <div class="warning-item">
        <strong>{warning.database_nickname || warning.database_name}</strong>
        <p>PostgreSQL {warning.postgres_major_version}</p>
        <p>{warning.warning_message}</p>
      </div>
    {/each}
  </div>
{/if}
```

### With dismissal logic (future enhancement)

```svelte
<script>
  import { deprecationWarnings } from '@mathesar/stores/deprecationWarnings';
  import { writable } from 'svelte/store';
  
  const dismissedWarnings = writable<Set<number>>(new Set());
  
  function dismissWarning(databaseId: number) {
    dismissedWarnings.update(set => {
      set.add(databaseId);
      return set;
    });
    // Save to localStorage or API
  }
</script>

{#each $deprecationWarnings.filter(w => !$dismissedWarnings.has(w.database_id)) as warning (warning.database_id)}
  <div>
    <button on:click={() => dismissWarning(warning.database_id)}>Dismiss</button>
    <!-- Rest of warning content -->
  </div>
{/each}
```

## Integration Examples

### In App Header

```svelte
<!-- AppHeader.svelte -->
<script>
  import { hasDeprecationWarnings } from '@mathesar/stores/deprecationWarnings';
</script>

<header>
  {#if $hasDeprecationWarnings}
    <div class="warning-indicator">⚠️ Database warnings</div>
  {/if}
  <!-- Rest of header -->
</header>
```

### In Database Detail Page

```svelte
<!-- pages/database/[id].svelte -->
<script>
  import DeprecationWarnings from '@mathesar/components/DeprecationWarnings.svelte';
  import DatabaseContent from './DatabaseContent.svelte';
</script>

<div class="database-page">
  <DeprecationWarnings />
  <DatabaseContent />
</div>
```

### With Admin Actions

```svelte
<!-- Admin panel component -->
<script>
  import { deprecationWarnings } from '@mathesar/stores/deprecationWarnings';
  import { onMount } from 'svelte';
  
  onMount(async () => {
    await deprecationWarnings.refresh();
  });
  
  async function upgradeDatabase(databaseId: number) {
    // Call upgrade API
    await api.databases.upgrade_sql({ database_id: databaseId });
    // Refresh warnings after upgrade
    await deprecationWarnings.refresh();
  }
</script>

<div class="admin-deprecation-panel">
  {#each $deprecationWarnings as warning}
    <div class="deprecation-item">
      <h3>{warning.database_name}</h3>
      <p>PostgreSQL {warning.postgres_major_version}</p>
      <button on:click={() => upgradeDatabase(warning.database_id)}>
        Schedule Upgrade
      </button>
    </div>
  {/each}
</div>
```

## Configuration Examples

### Adding a new deprecated version

Edit `db/version.py`:

```python
DEPRECATED_POSTGRES_VERSIONS = {
    13: {
        "deprecated_since": "0.8.0",
        "message": "PostgreSQL 13 is no longer supported. Please upgrade to PostgreSQL 14 or higher."
    },
    12: {
        "deprecated_since": "0.7.0",
        "message": "PostgreSQL 12 is no longer supported. Please upgrade to PostgreSQL 13 or higher."
    }
}
```

### Changing minimum supported version

```python
MINIMUM_SUPPORTED_VERSION = 15  # Changed from 14
```

## Testing Examples

### Unit test for version checking

```python
from db.version import is_postgres_version_deprecated, get_deprecation_message

def test_postgres_13_is_deprecated():
    assert is_postgres_version_deprecated(13) is True
    message = get_deprecation_message(13)
    assert "PostgreSQL 13" in message
    assert "not supported" in message

def test_postgres_14_is_supported():
    assert is_postgres_version_deprecated(14) is False
    assert get_deprecation_message(14) is None
```

### Integration test

```python
import pytest
from mathesar.utils.database_warnings import get_database_deprecation_warnings

@pytest.mark.django_db
def test_deprecation_warnings(user, create_test_database):
    database = create_test_database()
    warnings = get_database_deprecation_warnings(database.id, user)
    
    assert isinstance(warnings, list)
    if warnings:
        warning = warnings[0]
        assert warning['database_id'] == database.id
        assert 'warning_message' in warning
```

## Error Handling Examples

### Graceful handling of connection errors

```python
from mathesar.utils.database_warnings import get_database_deprecation_warnings

try:
    warnings = get_database_deprecation_warnings(database_id=1, user=user)
    # Process warnings...
except Exception as e:
    # Connection error - gracefully handle
    logger.error(f"Could not fetch warnings: {e}")
    warnings = []  # Return empty list to avoid breaking UI
```

## Performance Notes

- Warnings are fetched on-demand via RPC calls
- Implement caching in frontend store for better performance
- Consider batching calls if checking multiple databases
- Database queries are efficient (using SHOW commands)

## Security Notes

- Authentication required for all RPC methods
- User only sees warnings for their accessible databases
- No sensitive data in warnings (only version info already discoverable)
- Connection errors silently handled (no information disclosure)
