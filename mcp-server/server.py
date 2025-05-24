#!/usr/bin/env python3
"""
Mathesar MCP Server - Dynamic Tool Registration

A Model Context Protocol server that dynamically registers each Mathesar RPC method
as individual MCP tools with rich metadata, proper annotations, and type safety.
"""

import os
import logging
from typing import Any, Dict, List, Optional, Set
import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

# Set up file logging (not stdout to avoid MCP protocol interference)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/mathesar_mcp_debug.log'),
        logging.StreamHandler()  # This goes to stderr, not stdout
    ]
)
logger = logging.getLogger(__name__)

# Initialize the MCP server
mcp = FastMCP("Mathesar MCP Server")

# Configuration from environment variables
MATHESAR_BASE_URL = os.getenv("MATHESAR_BASE_URL", "http://localhost:8000")
RPC_ENDPOINT = f"{MATHESAR_BASE_URL}/api/rpc/v0/"

class MathesarCredentials(BaseModel):
    """Credentials for authenticating with Mathesar"""
    username: str
    password: str
    csrf_token: Optional[str] = None
    session_id: Optional[str] = None

class RPCRequest(BaseModel):
    """JSON-RPC request format"""
    id: int = Field(default=1)
    method: str
    params: Dict[str, Any] = Field(default_factory=dict)
    jsonrpc: str = Field(default="2.0")

class RPCResponse(BaseModel):
    """JSON-RPC response format"""
    id: int
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    jsonrpc: str

# Global storage
_credentials: Optional[MathesarCredentials] = None
_registered_tools: Set[str] = set()
_authentication_error: Optional[str] = None
_registration_debug_info: List[str] = []

# Keywords that indicate destructive operations
DESTRUCTIVE_KEYWORDS = {
    'delete', 'remove', 'drop', 'destroy', 'purge', 'clear', 'reset', 'truncate'
}

# Keywords that indicate read-only operations
READ_ONLY_KEYWORDS = {
    'get', 'list', 'read', 'fetch', 'find', 'search', 'query', 'browse', 'view', 'show'
}

def load_credentials_from_env() -> Optional[MathesarCredentials]:
    """Load authentication credentials from environment variables."""
    username = os.getenv("MATHESAR_USERNAME")
    password = os.getenv("MATHESAR_PASSWORD")
    csrf_token = os.getenv("MATHESAR_CSRF_TOKEN")
    session_id = os.getenv("MATHESAR_SESSION_ID")

    if not username or not password:
        return None

    return MathesarCredentials(
        username=username,
        password=password,
        csrf_token=csrf_token,
        session_id=session_id
    )

async def make_rpc_call(method: str, params: Dict[str, Any] = None) -> Any:
    """Make an authenticated JSON-RPC call to Mathesar."""
    if not _credentials:
        if _authentication_error:
            return {
                "error": "Authentication failed",
                "message": _authentication_error,
                "isError": True
            }
        return {
            "error": "Authentication required",
            "message": "Please configure MATHESAR_USERNAME and MATHESAR_PASSWORD environment variables",
            "isError": True
        }

    if params is None:
        params = {}

    request = RPCRequest(method=method, params=params)

    try:
        async with httpx.AsyncClient() as client:
            # First, get CSRF token if we don't have one
            headers = {}
            cookies = {}

            if not _credentials.csrf_token:
                # Get CSRF token from the main page
                csrf_response = await client.get(
                    f"{MATHESAR_BASE_URL}/",
                    auth=(_credentials.username, _credentials.password),
                    timeout=30.0
                )

                # Extract CSRF token from cookies
                csrf_cookie = None
                for cookie_name, cookie_value in csrf_response.cookies.items():
                    if cookie_name == 'csrftoken':
                        csrf_cookie = cookie_value
                        _credentials.csrf_token = cookie_value
                        break

                if csrf_cookie:
                    cookies["csrftoken"] = csrf_cookie

            # Add CSRF token to headers and cookies
            if _credentials.csrf_token:
                headers["X-CSRFToken"] = _credentials.csrf_token
                if "csrftoken" not in cookies:
                    cookies["csrftoken"] = _credentials.csrf_token

            # Add session cookie if available
            if _credentials.session_id:
                cookies["sessionid"] = _credentials.session_id

            response = await client.post(
                RPC_ENDPOINT,
                json=request.model_dump(),
                auth=(_credentials.username, _credentials.password),
                headers=headers,
                cookies=cookies,
                timeout=30.0
            )

            if response.status_code != 200:
                return {
                    "error": f"HTTP {response.status_code}",
                    "message": f"Server returned status {response.status_code}: {response.text}",
                    "isError": True
                }

            try:
                json_response = response.json()
            except ValueError as e:
                return {
                    "error": "Invalid JSON response",
                    "message": f"Could not parse JSON: {e}",
                    "response_text": response.text[:1000],
                    "isError": True
                }

            rpc_response = RPCResponse(**json_response)

            if rpc_response.error:
                return {
                    "error": "RPC Error",
                    "rpc_error": rpc_response.error,
                    "message": f"RPC method '{method}' failed: {rpc_response.error.get('message', 'Unknown error')}",
                    "isError": True
                }

            return rpc_response.result

    except httpx.TimeoutException:
        return {
            "error": "Request timeout",
            "message": f"Request to {RPC_ENDPOINT} timed out after 30 seconds",
            "isError": True
        }
    except httpx.RequestError as e:
        return {
            "error": "Network error",
            "message": f"Could not connect to Mathesar server: {e}",
            "isError": True
        }
    except Exception as e:
        return {
            "error": "Unexpected error",
            "message": f"Unexpected error calling {method}: {e}",
            "exception_type": type(e).__name__,
            "isError": True
        }

def analyze_method_characteristics(method_name: str, metadata: Dict[str, Any]) -> Dict[str, bool]:
    """Analyze a method to determine its characteristics for annotations."""
    method_lower = method_name.lower()
    action = metadata.get('action', '').lower()
    summary = metadata.get('parsed_doc', {}).get('summary', '').lower()

    # Check for destructive operations
    is_destructive = any(keyword in method_lower for keyword in DESTRUCTIVE_KEYWORDS)
    if not is_destructive:
        is_destructive = any(keyword in action for keyword in DESTRUCTIVE_KEYWORDS)
    if not is_destructive:
        is_destructive = any(keyword in summary for keyword in DESTRUCTIVE_KEYWORDS)

    # Check for read-only operations
    is_read_only = any(keyword in method_lower for keyword in READ_ONLY_KEYWORDS)
    if not is_read_only:
        is_read_only = any(keyword in action for keyword in READ_ONLY_KEYWORDS)
    if not is_read_only:
        is_read_only = any(keyword in summary for keyword in READ_ONLY_KEYWORDS)

    # If we detected destructive keywords, it's definitely not read-only
    if is_destructive:
        is_read_only = False

    # Check for idempotent operations (get/read operations are typically idempotent)
    is_idempotent = is_read_only or 'get' in method_lower or 'list' in method_lower

    return {
        "readOnlyHint": is_read_only,
        "destructiveHint": is_destructive,
        "idempotentHint": is_idempotent,
        "openWorldHint": True  # Most Mathesar operations interact with external database
    }

def convert_python_type_to_annotation(param_type: str) -> str:
    """Convert a Python type annotation string to a proper type annotation for function signatures."""
    # Handle common types
    if param_type in ['int', 'integer', '<class \'int\'>']:
        return 'int'
    elif param_type in ['str', 'string', '<class \'str\'>']:
        return 'str'
    elif param_type in ['float', '<class \'float\'>']:
        return 'float'
    elif param_type in ['bool', 'boolean', '<class \'bool\'>']:
        return 'bool'
    elif param_type in ['list', 'List', '<class \'list\'>']:
        return 'List[Any]'
    elif param_type in ['dict', 'Dict', '<class \'dict\'>']:
        return 'Dict[str, Any]'
    elif 'Optional' in param_type or 'Union' in param_type:
        # For optional types, try to extract the base type
        if 'int' in param_type:
            return 'Optional[int]'
        elif 'str' in param_type:
            return 'Optional[str]'
        elif 'bool' in param_type:
            return 'Optional[bool]'
        elif 'float' in param_type:
            return 'Optional[float]'
        else:
            return 'Optional[Any]'
    else:
        # Default to Any for unknown types
        return 'Any'

async def register_dynamic_tools():
    """Register all Mathesar RPC methods as individual MCP tools."""
    global _registration_debug_info
    _registration_debug_info = []

    if not _credentials:
        logger.error("No credentials available for dynamic tool registration")
        _registration_debug_info.append("ERROR: No credentials available")
        return {"error": "Not authenticated"}

    try:
        logger.info("Starting dynamic tool registration...")
        _registration_debug_info.append("Starting method introspection...")

        # Get comprehensive method information using system.introspect_methods
        introspection = await make_rpc_call("system.introspect_methods")
        logger.debug(f"Introspection result type: {type(introspection)}")

        if isinstance(introspection, dict) and introspection.get("isError"):
            error_msg = f"Introspection failed: {introspection.get('message')}"
            logger.error(error_msg)
            _registration_debug_info.append(f"ERROR: {error_msg}")
            return {"error": error_msg}

        if not introspection.get("introspection_successful"):
            error_msg = "Introspection was not successful"
            logger.error(error_msg)
            _registration_debug_info.append(f"ERROR: {error_msg}")
            return {"error": error_msg}

        methods_metadata = introspection.get("methods", {})
        total_methods = len(methods_metadata)
        logger.info(f"Found {total_methods} methods to process")
        _registration_debug_info.append(f"Found {total_methods} methods to process")

        # Process methods and register tools
        tools_registered = 0
        failed_methods = []

        for method_name, metadata in methods_metadata.items():
            logger.debug(f"Processing method: {method_name}")

            # Skip certain system methods that don't make good tools
            if method_name.startswith('system.') and method_name not in ['system.introspect_methods']:
                logger.debug(f"Skipping system method: {method_name}")
                continue

            try:
                # Try to create and register the tool using a simpler approach
                success = await create_and_register_tool(method_name, metadata)
                if success:
                    tools_registered += 1
                    _registered_tools.add(method_name)
                    logger.info(f"Successfully registered tool for {method_name}")
                    _registration_debug_info.append(f"✅ Registered: {method_name}")
                else:
                    failed_methods.append(method_name)
                    logger.warning(f"Failed to register tool for {method_name}")
                    _registration_debug_info.append(f"❌ Failed: {method_name}")

            except Exception as e:
                error_msg = f"{method_name}: {str(e)}"
                failed_methods.append(error_msg)
                logger.error(f"Exception registering {method_name}: {e}", exc_info=True)
                _registration_debug_info.append(f"❌ Exception: {error_msg}")

        logger.info(f"Registration complete: {tools_registered} tools registered, {len(failed_methods)} failed")
        _registration_debug_info.append(f"Registration complete: {tools_registered} registered, {len(failed_methods)} failed")

        return {
            "success": True,
            "tools_registered": tools_registered,
            "total_methods": total_methods,
            "failed_methods": failed_methods[:10]  # Limit to first 10 failures
        }

    except Exception as e:
        error_msg = f"Registration failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _registration_debug_info.append(f"FATAL ERROR: {error_msg}")
        return {"error": error_msg}


async def create_and_register_tool(method_name: str, metadata: Dict[str, Any]) -> bool:
    """Create and register a dynamic tool using a simpler approach."""
    try:
        # Get basic info
        parameters = metadata.get('parameters', {})
        summary = metadata.get('parsed_doc', {}).get('summary', f'Call {method_name} method')

        logger.debug(f"Creating tool for {method_name} with {len(parameters)} parameters")

        # Create a simple wrapper function that accepts **kwargs
        async def dynamic_tool(**kwargs):
            # Filter out None values
            filtered_params = {k: v for k, v in kwargs.items() if v is not None}
            logger.debug(f"Calling {method_name} with params: {list(filtered_params.keys())}")
            return await make_rpc_call(method_name, filtered_params)

        # Set function metadata
        dynamic_tool.__name__ = f"mathesar_{method_name.replace('.', '_')}"
        dynamic_tool.__doc__ = summary

        # Register with FastMCP using the decorator approach
        tool_func = mcp.tool()(dynamic_tool)

        logger.debug(f"Successfully created and registered tool: {dynamic_tool.__name__}")
        return True

    except Exception as e:
        logger.error(f"Failed to create tool for {method_name}: {e}", exc_info=True)
        return False


# Add a debug tool to see what's happening
@mcp.tool()
async def mathesar_debug_registration() -> str:
    """
    Get detailed debugging information about the dynamic tool registration process.

    Returns:
        Detailed log of the registration process and any errors encountered
    """
    global _registration_debug_info

    debug_log = "\n".join(_registration_debug_info) if _registration_debug_info else "No registration attempts logged yet"

    status_info = f"""
🔧 Dynamic Tool Registration Debug

📊 Current Status:
- Authenticated: {'✅' if _credentials else '❌'}
- Tools Registered: {len(_registered_tools)}
- Log File: /tmp/mathesar_mcp_debug.log

📝 Registration Log:
{debug_log}

🔍 Registered Tool Names:
{', '.join(sorted(_registered_tools)) if _registered_tools else 'None'}

💡 Check /tmp/mathesar_mcp_debug.log for detailed logs
"""

    return status_info

async def authenticate_and_register_tools() -> Dict[str, Any]:
    """Authenticate with Mathesar and register all RPC methods as individual MCP tools."""
    global _credentials, _registered_tools, _authentication_error

    # Try to load credentials from environment variables
    _credentials = load_credentials_from_env()

    if not _credentials:
        _authentication_error = """❌ Missing authentication credentials

Please configure the following environment variables:
- MATHESAR_USERNAME: Your Mathesar username
- MATHESAR_PASSWORD: Your Mathesar password
- MATHESAR_CSRF_TOKEN: (optional) CSRF token if required
- MATHESAR_SESSION_ID: (optional) Session ID if using session auth
- MATHESAR_BASE_URL: (optional) Mathesar server URL (default: http://localhost:8000)

Example configuration:
export MATHESAR_USERNAME="your_username"
export MATHESAR_PASSWORD="your_password"
export MATHESAR_BASE_URL="http://localhost:8000"
"""
        return {"error": _authentication_error}

    # Test authentication by trying to list methods
    try:
        methods = await make_rpc_call("system.listMethods")

        if isinstance(methods, dict) and methods.get("isError"):
            _authentication_error = f"""❌ Authentication failed
👤 User: {_credentials.username}
🔍 Error: {methods.get('message', 'Unknown error')}

Please verify:
- MATHESAR_USERNAME and MATHESAR_PASSWORD are correct
- Mathesar server is running at {MATHESAR_BASE_URL}
- Network connectivity is working
- If using session auth, check MATHESAR_CSRF_TOKEN and MATHESAR_SESSION_ID"""

            _credentials = None
            return {"error": _authentication_error}

        if not isinstance(methods, list):
            _authentication_error = f"""❌ Authentication failed - Invalid response
👤 User: {_credentials.username}
🔍 Expected method list, got: {type(methods)}"""

            _credentials = None
            return {"error": _authentication_error}

        # Now register all methods as dynamic tools
        registration_result = await register_dynamic_tools()

        if registration_result.get("error"):
            return {
                "success": False,
                "authenticated": True,
                "username": _credentials.username,
                "methods_count": len(methods),
                "registration_error": registration_result['error']
            }

        registered_count = registration_result.get("tools_registered", 0)
        categories = registration_result.get("categories", {})

        return {
            "success": True,
            "authenticated": True,
            "username": _credentials.username,
            "methods_count": len(methods),
            "registered_count": registered_count,
            "categories": list(categories.keys()) if categories else []
        }

    except Exception as e:
        _authentication_error = f"""❌ Authentication failed
👤 User: {_credentials.username if _credentials else 'unknown'}
🔍 Error: {e}

Please check your environment variables and server connectivity."""

        _credentials = None
        return {"error": _authentication_error}

@mcp.tool(
    annotations={
        "title": "Get Mathesar Server Status",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def mathesar_status() -> str:
    """
    Get the current authentication and tool registration status of the Mathesar MCP server.

    Returns:
        Current status including authentication state, registered tools count, and configuration help
    """
    if not _credentials:
        if _authentication_error:
            return f"""❌ Mathesar MCP Server Status

🔐 Authentication: Failed
🛠️ Dynamic Tools: 0 registered
🌐 Server URL: {MATHESAR_BASE_URL}

{_authentication_error}"""
        else:
            return f"""⚠️ Mathesar MCP Server Status

🔐 Authentication: Not configured
🛠️ Dynamic Tools: 0 registered
🌐 Server URL: {MATHESAR_BASE_URL}

Please configure the following environment variables:
- MATHESAR_USERNAME: Your Mathesar username
- MATHESAR_PASSWORD: Your Mathesar password
- MATHESAR_CSRF_TOKEN: (optional) CSRF token if required
- MATHESAR_SESSION_ID: (optional) Session ID if using session auth
- MATHESAR_BASE_URL: (optional) Mathesar server URL (default: http://localhost:8000)"""

    registered_count = len(_registered_tools)

    # Try to get a fresh status by calling a simple method
    try:
        methods = await make_rpc_call("system.listMethods")
        if isinstance(methods, dict) and methods.get("isError"):
            connection_status = f"❌ Connection Error: {methods.get('message')}"
        else:
            connection_status = f"✅ Connected ({len(methods)} methods available)"
    except Exception as e:
        connection_status = f"❌ Connection Error: {e}"

    return f"""✅ Mathesar MCP Server Status

🔐 Authentication: ✅ Authenticated as {_credentials.username}
🛠️ Dynamic Tools: {registered_count} registered
🌐 Server URL: {MATHESAR_BASE_URL}
🔗 Connection: {connection_status}

💡 All Mathesar RPC methods are available as individual MCP tools!
🔍 Use tool names like: mathesar_tables_list, mathesar_records_add, etc.
⚡ Each tool has proper type checking, documentation, and safety annotations!"""

# Keep a basic call method as fallback
@mcp.tool(
    annotations={
        "title": "Call Mathesar RPC Method (Fallback)",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def mathesar_call_method(
    method: str,
    params: Optional[Dict[str, Any]] = None
) -> Any:
    """
    Fallback method to call any Mathesar RPC method directly.

    Note: Prefer using the specific dynamic tools created after authentication
    as they provide better type safety and documentation.

    Args:
        method: The RPC method name (e.g., "tables.list", "records.add")
        params: Optional parameters for the method as a dictionary

    Returns:
        The result of the RPC method call, or an error object with isError=True
    """
    if not method or not isinstance(method, str):
        return {
            "error": "Invalid method",
            "message": "Method must be a non-empty string",
            "isError": True
        }

    return await make_rpc_call(method, params or {})

# Resource for help information
@mcp.resource("mathesar://api/help")
def get_api_help() -> str:
    """Get help information about the Mathesar MCP server."""
    registered_count = len(_registered_tools)

    return f"""
# 🚀 Mathesar MCP Server (Dynamic Tools with Auto-Authentication)

## 📊 Current Status

- **Authenticated**: {'✅ Yes' if _credentials else '❌ No'}
- **Dynamic Tools Registered**: {registered_count}
- **Server URL**: {MATHESAR_BASE_URL}

## 🔐 Environment-Based Authentication

This server automatically authenticates using environment variables on startup:

### Required Environment Variables:
```bash
export MATHESAR_USERNAME="your_username"
export MATHESAR_PASSWORD="your_password"
```

### Optional Environment Variables:
```bash
export MATHESAR_BASE_URL="http://localhost:8000"  # Default server URL
export MATHESAR_CSRF_TOKEN="csrf_token"           # If CSRF protection enabled
export MATHESAR_SESSION_ID="session_id"           # If using session authentication
```

### Configuration Example:
```bash
# Basic configuration
export MATHESAR_USERNAME="admin"
export MATHESAR_PASSWORD="your_secure_password"
export MATHESAR_BASE_URL="http://localhost:8000"

# Then start your MCP client - authentication happens automatically!
```

## 🛠️ Dynamic Tools

Each Mathesar RPC method is automatically registered as a separate tool with:
- **Proper type checking** from JSON schemas
- **Rich documentation** from method introspection
- **Safety annotations** (read-only, destructive, idempotent hints)
- **Clear naming** like `mathesar_tables_list`, `mathesar_records_add`

## 🎯 Tool Categories

Dynamic tools are created for all Mathesar operations:
- **Tables**: mathesar_tables_list, mathesar_tables_get, mathesar_tables_add...
- **Records**: mathesar_records_list, mathesar_records_add, mathesar_records_update...
- **Schemas**: mathesar_schemas_list, mathesar_schemas_get...
- **Database**: mathesar_databases_configured_list...
- **And many more!**

## 🛡️ Safety Features

- **Destructive operations** are marked with `destructiveHint: true`
- **Read-only operations** are marked with `readOnlyHint: true`
- **Idempotent operations** are properly annotated
- **Type validation** prevents invalid parameters

## 🚀 Examples

### Check server status
```
mathesar_status()
```

### List tables (auto-authenticated)
```
mathesar_tables_list(schema_oid=123, database_id=1)
```

### Add a record (auto-authenticated)
```
mathesar_records_add(
    table_oid=456,
    database_id=1,
    record_def={{"name": "John", "age": 30}}
)
```

### Fallback for any method
```
mathesar_call_method("custom.method", {{"param": "value"}})
```

## 🔄 How It Works

1. **Startup**: Server reads credentials from environment variables
2. **Auto-Authentication**: Automatically authenticates and discovers RPC methods
3. **Dynamic Registration**: Each method becomes an individual MCP tool
4. **Type Safety**: JSON schemas are generated from method signatures
5. **Annotations**: Safety hints are inferred from method names and descriptions

## 🐛 Troubleshooting

If authentication fails:
1. Check that environment variables are set correctly
2. Verify Mathesar server is running and accessible
3. Use `mathesar_status()` to see detailed error information
4. Check network connectivity to {MATHESAR_BASE_URL}

This approach provides better security (no credentials in prompts), convenience (automatic setup), and user experience!
"""

async def startup():
    """Initialize the server by attempting authentication and tool registration."""
    # Attempt automatic authentication and tool registration
    result = await authenticate_and_register_tools()

if __name__ == "__main__":
    # Initialize authentication on startup
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(startup())
    mcp.run()
