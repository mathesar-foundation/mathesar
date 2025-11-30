# PostgreSQL Deprecation Warnings - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Svelte)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  DeprecationWarnings.svelte (Main Component)            │
│      ↓                                                  │
│  DeprecationWarningBox.svelte (Warning Display)         │
│      ↑                                                  │
│  deprecationWarnings Store                              │
│      ↑                                                  │
│  RPC API Call → databases.get_all_deprecation_warnings  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         ↓ (HTTP JSON-RPC)
┌─────────────────────────────────────────────────────────┐
│                    Backend (Django)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  RPC Method Handler                                     │
│  (mathesar/rpc/databases/base.py)                       │
│      ↓                                                  │
│  get_database_deprecation_warnings()                    │
│  (mathesar/utils/database_warnings.py)                  │
│      ↓                                                  │
│  get_postgres_version()                                 │
│  (db/version.py)                                        │
│      ↓                                                  │
│  PostgreSQL Connection                                  │
│      ↓                                                  │
│  SHOW server_version_num                               │
│  SHOW server_version                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         ↓
                  PostgreSQL Database
```

## Layer Breakdown

### 1. Database Layer (`db/version.py`)

**Responsibility:** Low-level PostgreSQL version detection

```
get_postgres_version(conn)
    ├── Execute: SHOW server_version_num
    ├── Execute: SHOW server_version
    ├── Parse version number to major.minor
    ├── Check against DEPRECATED_POSTGRES_VERSIONS
    └── Return PostgresVersionInfo TypedDict

is_postgres_version_deprecated(major_version)
    └── Check if major_version in DEPRECATED_POSTGRES_VERSIONS

get_deprecation_message(major_version)
    └── Return message from DEPRECATED_POSTGRES_VERSIONS
```

**Data Structure:**
```python
PostgresVersionInfo = TypedDict({
    'version_string': str,           # "13.5 (Debian...)"
    'version_number': int,           # 130005
    'major_version': int,            # 13
    'minor_version': int,            # 5
    'is_deprecated': bool,           # True/False
    'deprecation_message': Optional[str]
})
```

### 2. Business Logic Layer (`mathesar/utils/database_warnings.py`)

**Responsibility:** Collect and organize deprecation warnings

```
get_database_deprecation_warnings(database_id, user)
    ├── Get Database model
    ├── Connect as user
    ├── Call get_postgres_version()
    ├── Create DeprecationWarning if deprecated
    └── Return list of warnings

get_all_database_deprecation_warnings(user)
    ├── Get all UserDatabaseRoleMap for user
    └── Call get_database_deprecation_warnings() for each
        └── Aggregate results

get_internal_database_deprecation_warnings(database_id)
    ├── Get Database model
    ├── Connect as admin
    ├── Call get_postgres_version()
    └── Return warnings
```

**Data Structure:**
```python
DeprecationWarning = TypedDict({
    'database_id': int,
    'database_name': str,
    'database_nickname': Optional[str],
    'postgres_version': str,
    'postgres_major_version': int,
    'warning_message': str,
    'warning_type': str  # "postgres_version"
})
```

### 3. API Layer (`mathesar/rpc/databases/base.py`)

**Responsibility:** Expose warnings through RPC API

```
@mathesar_rpc_method(name="databases.get_deprecation_warnings", auth="login")
def get_deprecation_warnings(database_id, user)
    ├── Validate user authentication
    ├── Call get_database_deprecation_warnings()
    └── Convert TypedDict to list and return

@mathesar_rpc_method(name="databases.get_all_deprecation_warnings", auth="login")
def get_all_deprecation_warnings(user)
    ├── Validate user authentication
    ├── Call get_all_database_deprecation_warnings()
    └── Convert TypedDict list to list and return
```

**RPC Signatures:**
```
Method: databases.get_deprecation_warnings
Params: { database_id: number }
Returns: [ DeprecationWarning, ... ]

Method: databases.get_all_deprecation_warnings
Params: {}
Returns: [ DeprecationWarning, ... ]
```

### 4. Store Layer (`mathesar_ui/src/stores/deprecationWarnings.ts`)

**Responsibility:** State management and data caching

```
deprecationWarnings (Writable Store)
    ├── subscribe() - Get updates
    └── refresh() - Fetch latest from API

postgresDeprecationWarnings (Derived)
    └── Filter for warning_type === "postgres_version"

hasDeprecationWarnings (Derived)
    └── Boolean: length > 0
```

### 5. UI Layer (Svelte Components)

**Responsibility:** Display warnings to users

```
DeprecationWarnings.svelte
    ├── onMount: Call deprecationWarnings.refresh()
    ├── Loop through $postgresDeprecationWarnings
    └── Render DeprecationWarningBox for each

DeprecationWarningBox.svelte
    ├── Accept: databaseName, postgresVersion, warningMessage
    └── Render: MessageBox with warning styling
```

## Data Flow

### User Views Deprecated Database

```
1. User navigates to page
   ↓
2. Component mounts
   ↓
3. onMount: deprecationWarnings.refresh()
   ↓
4. Store fetches via RPC: api.databases.get_all_deprecation_warnings()
   ↓
5. Backend RPC handler:
   a. Get current user
   b. Get all their database connections
   c. For each database:
      - Connect to database
      - Get PostgreSQL version
      - Check deprecation status
      - Create warning if deprecated
   d. Return warnings list
   ↓
6. Frontend store updates $postgresDeprecationWarnings
   ↓
7. Svelte reactivity triggers re-render
   ↓
8. DeprecationWarnings component renders warnings
   ↓
9. User sees warning message
```

## Error Handling Flow

```
get_postgres_version(conn)
    ├── Try: Execute queries
    └── Except: Raise exception

get_database_deprecation_warnings(db_id, user)
    ├── Try: Get database and connect
    ├── Try: Call get_postgres_version()
    └── Except: Return empty list (silently fail)

Frontend: deprecationWarnings.refresh()
    ├── Try: Call RPC API
    └── Catch: Log error, return []
            (UI doesn't break)
```

## Security Architecture

```
RPC Method Authorization
    ├── @mathesar_rpc_method(auth="login")
    │   ├── Verify user is authenticated
    │   └── Reject if not logged in
    │
    └── User-Specific Data
        ├── Only show warnings for user's databases
        └── Filter by UserDatabaseRoleMap(user=current_user)

Database Connection
    ├── Use user credentials when available
    └── Use admin credentials for internal checks
        (with proper authorization)

Information Disclosure
    └── Only expose version info already queryable
```

## Configuration Architecture

```
Version Configuration (db/version.py)
    ├── DEPRECATED_POSTGRES_VERSIONS = {
    │   version_number: {
    │       "deprecated_since": "0.8.0",
    │       "message": "Custom message"
    │   }
    │}
    │
    └── MINIMUM_SUPPORTED_VERSION = 14

Dynamic Updates
    ├── Edit db/version.py
    ├── Restart application
    └── New configuration takes effect immediately
        (no database migrations needed)
```

## Extension Points

### Adding New Warning Types

```
1. Create new detection function
   └── e.g., check_python_version()

2. Add to DeprecationWarning TypedDict
   └── Add new warning_type value

3. Update RPC methods to check new type
   └── Call multiple check functions

4. Create new Svelte component
   └── e.g., PythonDeprecationWarningBox.svelte

5. Filter in store or component
   └── Filter by warning_type
```

### Adding Persistent Dismissal

```
1. Add dismissal store
   └── dismissed_warnings: Set<string>

2. Save to localStorage or API
   └── User dismissal preferences

3. Filter warnings before display
   └── Remove dismissed warnings

4. Refresh logic updates store
   └── Re-fetch from API
```

### Adding Analytics

```
1. Track warning display
   └── Log event when warning shown

2. Track user actions
   └── Log dismissals, upgrades

3. Send to analytics backend
   └── Aggregate data for reporting
```

## Performance Considerations

### Frontend Performance
- **Lazy Loading**: Fetch warnings on-demand, not on page load
- **Caching**: Store warnings in Svelte store, avoid repeated API calls
- **Pagination**: If many warnings, paginate or group by server
- **Debouncing**: Limit refresh frequency with debounce

### Backend Performance
- **Connection Reuse**: Use existing connections when possible
- **Batch Operations**: Combine multiple database checks
- **Query Efficiency**: SHOW commands are very fast (< 1ms)
- **Error Handling**: Don't retry failed connections immediately

### Network Performance
- **Batch API Calls**: Fetch all warnings in one call
- **Compression**: RPC already compresses responses
- **Caching**: Frontend caches for duration of session

## Monitoring & Debugging

### Logging Points
```
db/version.py
    └── Log when querying version

mathesar/utils/database_warnings.py
    └── Log connection attempts
    └── Log warnings generated

mathesar/rpc/databases/base.py
    └── Log API calls

deprecationWarnings.ts
    └── Log fetch errors
    └── Log store updates
```

### Common Issues & Fixes

**Issue**: No warnings displayed
- Check user authentication
- Verify database connections exist
- Check PostgreSQL version detection

**Issue**: Stale warnings
- Clear browser localStorage
- Manually call deprecationWarnings.refresh()
- Check RPC connection

**Issue**: Connection errors
- Verify database credentials
- Check network connectivity
- Review application logs

## Deployment Checklist

- [ ] Migrate database models (if any changes)
- [ ] Run tests: `pytest db/tests/test_version.py`
- [ ] Run tests: `pytest mathesar/tests/test_database_warnings.py`
- [ ] Build frontend
- [ ] Update DEPRECATED_POSTGRES_VERSIONS as needed
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify warnings appear for deprecated versions
- [ ] Monitor logs for errors
- [ ] Update user documentation
