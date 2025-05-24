#!/usr/bin/env python3
"""
Mathesar MCP Server - Category-Based Tool Registration

A Model Context Protocol server that registers Mathesar RPC methods as category-based
MCP tools (tables, records, columns, etc.) to keep tool count manageable while providing
access to all Mathesar functionality through method parameters.
"""

import os
import logging
from typing import Any, Dict, List, Optional, Set
import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field
import inspect

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize the MCP server
mcp = FastMCP("Mathesar MCP Server - Category-Based")

# Configuration from environment variables
MATHESAR_BASE_URL = os.getenv("MATHESAR_BASE_URL", "http://localhost:8000")
MATHESAR_USERNAME = os.getenv("MATHESAR_USERNAME")
MATHESAR_PASSWORD = os.getenv("MATHESAR_PASSWORD")
MATHESAR_CSRF_TOKEN = os.getenv("MATHESAR_CSRF_TOKEN")
MATHESAR_SESSION_ID = os.getenv("MATHESAR_SESSION_ID")
RPC_ENDPOINT = f"{MATHESAR_BASE_URL}/api/rpc/v0/"

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

# Global storage for registered tools
_registered_tools: Set[str] = set()

# Keywords for method analysis
DESTRUCTIVE_KEYWORDS = {
    'delete', 'remove', 'drop', 'destroy', 'purge', 'clear', 'reset', 'truncate'
}

READ_ONLY_KEYWORDS = {
    'get', 'list', 'read', 'fetch', 'find', 'search', 'query', 'browse', 'view', 'show'
}

def check_auth_config() -> Optional[str]:
    """Check if required authentication is configured."""
    if not MATHESAR_USERNAME or not MATHESAR_PASSWORD:
        return "Missing MATHESAR_USERNAME or MATHESAR_PASSWORD environment variables"
    return None

async def make_rpc_call(method: str, params: Dict[str, Any] = None) -> Any:
    """Make an authenticated JSON-RPC call to Mathesar."""
    auth_error = check_auth_config()
    if auth_error:
        return {
            "error": "Authentication required",
            "message": auth_error,
            "isError": True
        }

    if params is None:
        params = {}

    request = RPCRequest(method=method, params=params)
    logger.info(f"[make_rpc_call] Attempting to send RPC request: {request.model_dump(exclude_none=True)}")

    try:
        async with httpx.AsyncClient() as client:
            headers = {}
            cookies = {}

            # Add CSRF token if available
            if MATHESAR_CSRF_TOKEN:
                headers["X-CSRFToken"] = MATHESAR_CSRF_TOKEN
                cookies["csrftoken"] = MATHESAR_CSRF_TOKEN

            # Add session cookie if available
            if MATHESAR_SESSION_ID:
                cookies["sessionid"] = MATHESAR_SESSION_ID

            response = await client.post(
                RPC_ENDPOINT,
                json=request.model_dump(),
                auth=(MATHESAR_USERNAME, MATHESAR_PASSWORD),
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
            "isError": True
        }

def analyze_method_characteristics(method_name: str, metadata: Dict[str, Any]) -> Dict[str, bool]:
    """Analyze a method to determine its characteristics for annotations."""
    method_lower = method_name.lower()
    summary = metadata.get('parsed_doc', {}).get('summary', '').lower()

    # Check for destructive operations
    is_destructive = any(keyword in method_lower for keyword in DESTRUCTIVE_KEYWORDS)
    if not is_destructive:
        is_destructive = any(keyword in summary for keyword in DESTRUCTIVE_KEYWORDS)

    # Check for read-only operations
    is_read_only = any(keyword in method_lower for keyword in READ_ONLY_KEYWORDS)
    if not is_read_only:
        is_read_only = any(keyword in summary for keyword in READ_ONLY_KEYWORDS)

    # If we detected destructive keywords, it's definitely not read-only
    if is_destructive:
        is_read_only = False

    # Check for idempotent operations
    is_idempotent = is_read_only or 'get' in method_lower or 'list' in method_lower

    return {
        "readOnlyHint": is_read_only,
        "destructiveHint": is_destructive,
        "idempotentHint": is_idempotent,
        "openWorldHint": True
    }

def convert_type_annotation(param_type: str) -> Any:
    """Convert parameter type string to Python type annotation."""
    # Handle common type mappings
    type_mapping = {
        "<class 'int'>": int,
        "<class 'str'>": str,
        "<class 'bool'>": bool,
        "<class 'float'>": float,
        "<class 'dict'>": dict,
        "<class 'list'>": list,
        "Any": Any,
    }

    # Check for exact matches first
    if param_type in type_mapping:
        return type_mapping[param_type]

    # Handle list types like "list[mathesar.rpc.columns.base.SettableColumnInfo]"
    if param_type.startswith("list[") and param_type.endswith("]"):
        return List[Any]  # Simplify complex list types to List[Any]

    # Handle dict types
    if "dict" in param_type.lower():
        return Dict[str, Any]

    # Handle specific Mathesar types
    if "mathesar.rpc" in param_type:
        # These are complex Mathesar objects, treat as Dict[str, Any] for flexibility
        return Dict[str, Any]

    # Default to Any for complex types
    return Any

def convert_default_value(default_value: Any) -> Any:
    """Convert default value from parameter metadata to a usable Python value."""
    if default_value is None or default_value == "None":
        return None

    # Handle string representations of Python literals
    if isinstance(default_value, str):
        # Handle common string patterns
        if default_value == "Required":
            return inspect.Parameter.empty
        elif default_value.lower() == "none":
            return None
        elif default_value.lower() == "true":
            return True
        elif default_value.lower() == "false":
            return False
        elif default_value == "[]":
            return []
        elif default_value == "{}":
            return {}
        else:
            # Try to evaluate as a literal
            try:
                import ast
                return ast.literal_eval(default_value)
            except (ValueError, SyntaxError):
                # If it can't be parsed as a literal, return as string
                return default_value

    # Return the value as-is for other types
    return default_value

def create_parameter_annotation(param_name: str, param_info: Dict[str, Any], parsed_args: Dict[str, Any]) -> tuple:
    """Create a proper type annotation and default for a parameter.

    CRITICAL FIX: JSON Number Type Handling
    =====================================
    JSON-RPC doesn't distinguish between integers and floats - both are "number" type.
    This caused Pydantic validation errors when Mathesar expected integer parameters.

    Our solution: Convert 'int' parameters to 'Union[int, float]' to accept JSON numbers.
    This allows the MCP framework to properly handle numeric parameters from JSON-RPC calls.

    Args:
        param_name: Name of the parameter
        param_info: Parameter metadata from Mathesar RPC introspection
        parsed_args: Parsed documentation arguments

    Returns:
        tuple: (type_annotation, default_value) for the parameter
    """
    param_type = param_info.get("type", "Any")
    default_value = param_info.get("default", "Required")

    # Get description from parsed documentation
    description = parsed_args.get(param_name, f"Parameter {param_name}")
    if not description or not str(description).strip():
        description = f"Parameter {param_name}"

    # Enhance description with type information
    if param_type and param_type != "Any":
        # Clean up type display
        clean_type = param_type.replace("<class '", "").replace("'>", "").replace("typing.", "")
        description = f"{description} (Type: {clean_type})"

    # Convert type annotation
    base_type = convert_type_annotation(param_type)

    # CRITICAL FIX: Handle JSON number ambiguity for integers
    # JSON doesn't distinguish between int and float, everything is "number"
    # So we need to be more permissive to handle JSON-RPC serialization
    if base_type is int:
        # Use Union[int, float] to handle JSON number type
        # This allows Pydantic to accept numeric values from JSON-RPC
        # regardless of whether they're transmitted as integers or floats
        from typing import Union
        base_type = Union[int, float]
        logger.debug(f"Parameter '{param_name}' converted from int to Union[int, float] for JSON compatibility")

    if default_value == "Required":
        # Required parameter
        annotation = base_type
        default = inspect.Parameter.empty
    elif default_value is None or default_value == "None":
        # Optional parameter with None default
        annotation = Optional[base_type]
        default = None
    else:
        # Parameter with specific default value
        annotation = Optional[base_type]
        default = convert_default_value(default_value)

    return annotation, default

def group_methods_by_category(methods_metadata: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Group RPC methods by their top-level category."""
    categories = {}
    total_methods = len(methods_metadata)
    processed_methods = 0
    skipped_methods = []

    for method_name, metadata in methods_metadata.items():
        # Log all methods being processed for debugging
        logger.debug(f"Processing method: {method_name}")

        # Skip internal system methods that shouldn't be exposed as tools
        # but be more permissive than before
        if method_name.startswith('system.') and method_name not in [
            'system.introspect_methods',
            'system.listMethods',  # Allow basic system methods
            'system.methodSignature',
            'system.methodHelp'
        ]:
            skipped_methods.append(method_name)
            continue

        # Extract category from method name (e.g., "tables.list" -> "tables")
        parts = method_name.split('.')
        if len(parts) >= 2:
            category = parts[0]
            action = '.'.join(parts[1:])  # Handle nested actions like "configured.list"
        else:
            category = 'system'
            action = method_name

        if category not in categories:
            categories[category] = {}

        categories[category][action] = {
            'method_name': method_name,
            'metadata': metadata
        }
        processed_methods += 1

    logger.info(f"Method grouping complete: {processed_methods}/{total_methods} methods processed into {len(categories)} categories")
    if skipped_methods:
        logger.info(f"Skipped {len(skipped_methods)} system methods: {skipped_methods[:5]}{'...' if len(skipped_methods) > 5 else ''}")

    return categories

def build_category_documentation(category: str, methods: Dict[str, Any]) -> str:
    """Build comprehensive documentation for a category tool."""
    docs = [f"Execute {category} operations in Mathesar.\n"]

    # Group methods by characteristics
    read_methods = []
    write_methods = []
    destructive_methods = []

    for action, method_info in methods.items():
        method_name = method_info['method_name']
        metadata = method_info['metadata']
        summary = metadata.get('parsed_doc', {}).get('summary', f'{action} operation')

        characteristics = analyze_method_characteristics(method_name, metadata)

        method_doc = f"  - {action}: {summary}"

        if characteristics.get('destructiveHint'):
            destructive_methods.append(method_doc)
        elif characteristics.get('readOnlyHint'):
            read_methods.append(method_doc)
        else:
            write_methods.append(method_doc)

    if read_methods:
        docs.append("📖 Read Operations:")
        docs.extend(read_methods)
        docs.append("")

    if write_methods:
        docs.append("✏️ Write Operations:")
        docs.extend(write_methods)
        docs.append("")

    if destructive_methods:
        docs.append("⚠️ Destructive Operations:")
        docs.extend(destructive_methods)
        docs.append("")

    docs.append("Parameters vary by method - provide only the parameters needed for your chosen method.")

    return "\n".join(docs)

def collect_all_parameters_for_category(methods: Dict[str, Any]) -> Dict[str, Any]:
    """Collect all unique parameters used across methods in a category."""
    all_params = {}

    for action, method_info in methods.items():
        metadata = method_info['metadata']
        parameters = metadata.get('parameters', {})
        args_list = metadata.get('args', [])
        parsed_args = metadata.get('parsed_doc', {}).get('args', {})

        # Filter out 'kwargs' from parameters
        filtered_params = {k: v for k, v in parameters.items() if k != 'kwargs'}

        for param_name in args_list:
            if param_name != 'kwargs' and param_name in filtered_params:
                param_info = filtered_params[param_name]
                if param_name not in all_params:
                    # Store parameter info with enhanced description
                    enhanced_desc = parsed_args.get(param_name, f"Parameter {param_name}")
                    param_type = param_info.get("type", "Any")

                    # Add type info to description
                    clean_type = param_type.replace("<class '", "").replace("'>", "").replace("mathesar.rpc.", "")
                    if clean_type != "Any":
                        enhanced_desc = f"{enhanced_desc} (Type: {clean_type})"

                    all_params[param_name] = {
                        'type': param_type,
                        'description': enhanced_desc,
                        'default': param_info.get('default', 'Required')
                    }

    return all_params

async def create_category_tool(category: str, methods: Dict[str, Any]) -> bool:
    """Create a single tool for an entire category of methods."""
    try:
        # Build documentation
        category_docs = build_category_documentation(category, methods)

        # Collect all parameters
        all_params = collect_all_parameters_for_category(methods)

        # Analyze overall characteristics (if most methods are read-only, mark as such)
        read_only_count = sum(1 for _, method_info in methods.items()
                             if analyze_method_characteristics(method_info['method_name'], method_info['metadata']).get('readOnlyHint'))
        destructive_count = sum(1 for _, method_info in methods.items()
                               if analyze_method_characteristics(method_info['method_name'], method_info['metadata']).get('destructiveHint'))

        characteristics = {
            "readOnlyHint": read_only_count > len(methods) * 0.6,  # Majority are read-only
            "destructiveHint": destructive_count > 0,  # Any destructive methods
            "idempotentHint": read_only_count > len(methods) * 0.6,
            "openWorldHint": True
        }

        # Create parameter annotations
        param_annotations = {}
        param_defaults = {}

        # Always include method parameter first
        from typing import Annotated
        method_choices = list(methods.keys())
        param_annotations['method'] = Annotated[str, Field(description=f"The {category} method to execute. Available: {', '.join(method_choices)}")]

        # Add all collected parameters as optional
        for param_name, param_info in all_params.items():
            annotation, default = create_parameter_annotation(param_name, param_info, {param_name: param_info['description']})
            param_annotations[param_name] = annotation
            if default is not inspect.Parameter.empty:
                param_defaults[param_name] = default

        # Create function signature
        sig_params = []

        # Method parameter (required)
        sig_params.append(inspect.Parameter(
            'method',
            inspect.Parameter.KEYWORD_ONLY,
            annotation=param_annotations['method']
        ))

        # All other parameters (optional)
        for param_name in sorted(all_params.keys()):
            if param_name in param_annotations:
                param = inspect.Parameter(
                    param_name,
                    inspect.Parameter.KEYWORD_ONLY,
                    default=param_defaults.get(param_name, None),
                    annotation=param_annotations[param_name]
                )
                sig_params.append(param)

        signature = inspect.Signature(sig_params)

        # Create the implementation
        async def category_tool_impl(**kwargs):
            logger.info(f"[category_tool_impl] Received kwargs: {kwargs}")
            method_action = kwargs.pop('method', None)
            logger.info(f"[category_tool_impl] Kwargs after popping 'method': {kwargs}, method_action: {method_action}")

            if not method_action:
                return {
                    "error": "Missing method parameter",
                    "message": f"Must specify which {category} method to execute",
                    "available_methods": list(methods.keys()),
                    "isError": True
                }

            if method_action not in methods:
                return {
                    "error": "Invalid method",
                    "message": f"Method '{method_action}' not available for {category}",
                    "available_methods": list(methods.keys()),
                    "isError": True
                }

            # Get the full method name
            full_method_name = methods[method_action]['method_name']

            # Filter out None values and prepare parameters
            filtered_kwargs = {k: v for k, v in kwargs.items() if v is not None}

            logger.info(f"[category_tool_impl] Calling {full_method_name} with filtered_kwargs: {filtered_kwargs}")
            return await make_rpc_call(full_method_name, filtered_kwargs)

        # Set function metadata
        category_tool_impl.__signature__ = signature
        category_tool_impl.__name__ = f"{category}"
        category_tool_impl.__doc__ = category_docs

        # Register the tool
        tool_func = mcp.tool(annotations=characteristics)(category_tool_impl)

        logger.info(f"Registered category tool: {category} with {len(methods)} methods and {len(all_params)} parameters")
        return True

    except Exception as e:
        logger.error(f"Failed to create category tool for {category}: {e}")
        logger.exception("Full traceback:")
        return False

async def register_dynamic_tools() -> Dict[str, Any]:
    """Register Mathesar RPC methods as category-based MCP tools."""
    auth_error = check_auth_config()
    if auth_error:
        return {"error": auth_error}

    try:
        logger.info("Starting category-based tool registration...")

        # Get method information using system.introspect_methods
        introspection = await make_rpc_call("system.introspect_methods")

        if isinstance(introspection, dict) and introspection.get("isError"):
            return {"error": f"Introspection failed: {introspection.get('message')}"}

        if not introspection.get("introspection_successful"):
            return {"error": "Introspection was not successful"}

        methods_metadata = introspection.get("methods", {})
        total_methods = len(methods_metadata)
        logger.info(f"Found {total_methods} methods to process")

        # Log a sample of methods for debugging
        method_names = list(methods_metadata.keys())
        if method_names:
            logger.info(f"Sample methods: {method_names[:10]}{'...' if len(method_names) > 10 else ''}")

        # Group methods by category
        categories = group_methods_by_category(methods_metadata)
        logger.info(f"Grouped into {len(categories)} categories: {list(categories.keys())}")

        # Log category details
        for category, methods in categories.items():
            method_count = len(methods)
            method_list = list(methods.keys())
            logger.debug(f"Category '{category}': {method_count} methods - {method_list[:5]}{'...' if method_count > 5 else ''}")

        # Register category tools
        tools_registered = 0
        failed_categories = []

        for category, methods in categories.items():
            try:
                success = await create_category_tool(category, methods)
                if success:
                    tools_registered += 1
                    _registered_tools.add(category)
                else:
                    failed_categories.append(category)

            except Exception as e:
                failed_categories.append(f"{category}: {str(e)}")
                logger.error(f"Exception registering category {category}: {e}")

        logger.info(f"Registration complete: {tools_registered} category tools registered")

        return {
            "success": True,
            "category_tools_registered": tools_registered,
            "total_methods": total_methods,
            "categories": list(categories.keys()),
            "failed_categories": failed_categories[:10]
        }

    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        return {"error": str(e)}

@mcp.tool()
async def mathesar_status() -> str:
    """Get diagnostic information about the Mathesar MCP server connection and registered tools."""
    auth_error = check_auth_config()
    if auth_error:
        return f"""❌ Mathesar MCP Server Diagnostics

🔐 Authentication: Not configured
🛠️ Tools: 0 registered
🌐 Server URL: {MATHESAR_BASE_URL}

Error: {auth_error}

Please configure:
- MATHESAR_USERNAME: Your username
- MATHESAR_PASSWORD: Your password
- MATHESAR_CSRF_TOKEN: (optional) CSRF token
- MATHESAR_SESSION_ID: (optional) Session ID
- MATHESAR_BASE_URL: (optional) Server URL"""

    registered_count = len(_registered_tools)

    # Test connection
    try:
        methods = await make_rpc_call("system.listMethods")
        if isinstance(methods, dict) and methods.get("isError"):
            connection_status = f"❌ Connection Error: {methods.get('message')}"
        else:
            connection_status = f"✅ Connected ({len(methods)} methods available)"
    except Exception as e:
        connection_status = f"❌ Connection Error: {e}"

    return f"""✅ Mathesar MCP Server Diagnostics

🔐 Authentication: ✅ Configured (User: {MATHESAR_USERNAME})
🛠️ Tools: {registered_count} registered
🌐 Server URL: {MATHESAR_BASE_URL}
🔗 Connection: {connection_status}

💡 Available tools: {', '.join(sorted(_registered_tools))}
Each tool accepts a 'method' parameter to specify the operation."""

async def startup():
    """Initialize the server by registering category-based tools."""
    logger.info("Starting Mathesar MCP Server...")

    auth_error = check_auth_config()
    if auth_error:
        logger.warning(f"Authentication not configured: {auth_error}")
        logger.info("Configure environment variables and restart to connect to Mathesar")
        return

    # Automatically register tools on startup
    logger.info("Attempting automatic tool registration...")
    result = await register_dynamic_tools()

    if result.get("error"):
        logger.error(f"Automatic registration failed: {result['error']}")
        logger.info("Check authentication and Mathesar server connection")
    else:
        category_tools = result.get("category_tools_registered", 0)
        categories = result.get("categories", [])
        logger.info(f"Successfully registered {category_tools} category tools!")
        logger.info(f"Available categories: {', '.join(sorted(categories))}")

def main():
    """Main entry point for the Mathesar MCP Server."""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(startup())
    mcp.run()

if __name__ == "__main__":
    main()
