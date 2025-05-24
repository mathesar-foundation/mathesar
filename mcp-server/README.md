# Mathesar MCP Server

A clean, efficient Model Context Protocol (MCP) server that provides AI assistants with full access to Mathesar's database operations through JSON-RPC calls.

## 🚀 Features

- **Simple HTTP-only design** - No complex module imports or Django setup
- **Full Mathesar API access** - Call any RPC method through `mathesar_call_method`
- **Proper MCP annotations** - Tools are properly categorized with behavior hints
- **Robust error handling** - Structured error responses that LLMs can understand
- **Auto-discovery** - Automatically discovers available methods on authentication
- **Quick helpers** - Convenient tools for common operations

## 📁 Project Structure

```
mcp-server/
├── server.py              # Main MCP server (clean implementation)
├── main.py                # Entry point
├── README.md              # This file
├── SUMMARY.md             # Detailed project summary
├── justfile               # Build and utility commands
├── claude-config.json     # Claude Desktop configuration
├── pyproject.toml         # Python dependencies
└── uv.lock                # Locked dependencies
```

## 🛠️ Installation

1. **Clone and navigate to the project:**
   ```bash
   cd mathesar/mcp-server
   ```

2. **Install dependencies:**
   ```bash
   just install
   # or: uv sync
   ```

3. **Make sure Mathesar is running:**
   ```bash
   just check-mathesar
   ```

## 🔧 Claude Desktop Setup

1. **Get the configuration:**
   ```bash
   just install-claude
   ```

2. **Add to Claude Desktop:**
   - Open Claude Desktop
   - Go to Settings → Developer
   - Edit Config and paste the configuration shown
   - Make sure the path points to your `mcp-server` directory

3. **Restart Claude Desktop**

## 🎯 Usage

Once configured, you can interact with Mathesar using natural language:

```
"Please authenticate with Mathesar using admin/password"
"What databases are available?"
"Show me all tables in the inventory database"
"Add a new customer record with name 'John Doe' and email 'john@example.com'"
"Create an exploration showing all orders from last month"
```

**💡 Pro tip:** Use the `/setup-mathesar` prompt (if your client supports prompts) for guided setup instructions!

## 🛠️ Available Tools

### Authentication & Discovery
- `mathesar_authenticate(username, password)` - Login and discover methods
- `mathesar_list_methods()` - List all available RPC methods
- `mathesar_browse_categories()` - Browse methods by category

### Primary Operations
- `mathesar_call_method(method, params)` - Call any Mathesar RPC method

### Quick Helpers
- `mathesar_quick_list_databases()` - List all databases
- `mathesar_quick_list_schemas(database_id)` - List schemas
- `mathesar_quick_list_tables(schema_oid, database_id)` - List tables
- `mathesar_quick_list_records(table_oid, database_id, limit)` - List records

### Setup & Guidance
- `setup-mathesar` prompt - Interactive setup guide (if client supports prompts)

## 🔍 Examples

### Authentication
```python
mathesar_authenticate("admin", "password")
```

### List databases
```python
mathesar_quick_list_databases()
```

### Call any RPC method
```python
mathesar_call_method("records.add", {
    "table_oid": 123,
    "database_id": 1,
    "record_def": {"name": "John", "age": 30}
})
```

### Complex operations
```python
# Create an exploration
mathesar_call_method("explorations.add", {
    "exploration_def": {
        "name": "Sales Analysis",
        "database_id": 1,
        "base_table_oid": 456,
        "initial_columns": [
            {"attnum": 2, "alias": "Customer Name"},
            {"attnum": 3, "alias": "Order Total"}
        ]
    }
})
```

## 🛡️ Error Handling

All tools return structured error objects when things go wrong:

```json
{
  "error": "Authentication required",
  "message": "Please call mathesar_authenticate first",
  "isError": true
}
```

This allows the LLM to see errors and take corrective action.

## 🔧 Development

### Test the server
```bash
just test
```

### Run directly
```bash
just run
# or: python server.py
```

### Clean up
```bash
just clean
```

## 📊 Architecture

This MCP server follows a clean, simple architecture:

1. **HTTP-only communication** - Uses Mathesar's JSON-RPC API directly
2. **No Django dependencies** - Runs independently of Mathesar's internals
3. **Minimal state** - Only caches authentication and discovered methods
4. **Proper MCP compliance** - Follows all MCP best practices
5. **Error-first design** - Comprehensive error handling throughout

## 🔗 Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Mathesar Documentation](https://docs.mathesar.org/)
- [Claude Desktop](https://claude.ai/desktop)

## 🆚 Previous Versions

This is a clean rewrite that removes:
- Complex Django setup attempts
- Direct module imports
- Redundant discovery mechanisms
- Outdated test files
- Legacy server versions

The focus is on simplicity, reliability, and MCP best practices.
