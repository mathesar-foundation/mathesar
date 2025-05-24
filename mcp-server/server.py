#!/usr/bin/env python3
"""
Mathesar MCP Server - Simplified Dynamic Tool Registration

A Model Context Protocol server that dynamically registers each Mathesar RPC method
as individual MCP tools using simple environment variable authentication.
"""

import os
import logging
from typing import Any, Dict, List, Optional, Set, Union, Annotated
import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field
import inspect
from types import FunctionType

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize the MCP server
mcp = FastMCP("Mathesar MCP Server")

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

def create_parameter_annotation(param_name: str, param_info: Dict[str, Any], parsed_args: Dict[str, Any]) -> tuple:
    """Create a proper type annotation and default for a parameter."""
    param_type = param_info.get("type", "Any")
    default_value = param_info.get("default", "Required")

    # Get description from parsed documentation
    # parsed_args values are strings directly, not dictionaries
    description = parsed_args.get(param_name, f"Parameter {param_name}")
    if not description or not str(description).strip():
        description = f"Parameter {param_name}"

    # Enhance description with type information
    if param_type and param_type != "Any":
        # Clean up type display
        clean_type = param_type.replace("<class '", "").replace("'>", "").replace("mathesar.rpc.", "")
        if clean_type != "Any":
            description = f"{description} (Type: {clean_type})"

    # Convert type annotation
    base_type = convert_type_annotation(param_type)

        # Handle default values and create proper annotations
    if default_value == "Required":
        # Required parameter with Pydantic Field
        from typing import Annotated
        annotation = Annotated[base_type, Field(description=description)]
        default = inspect.Parameter.empty
    elif default_value is None or default_value == "None":
        # Optional parameter with None default
        from typing import Annotated
        annotation = Annotated[Optional[base_type], Field(default=None, description=description)]
        default = None
    else:
        # Optional parameter with specific default
        try:
            if isinstance(default_value, str):
                if default_value.lower() == "true":
                    parsed_default = True
                elif default_value.lower() == "false":
                    parsed_default = False
                elif default_value.isdigit():
                    parsed_default = int(default_value)
                else:
                    parsed_default = default_value
            else:
                parsed_default = default_value
        except:
            parsed_default = default_value

        from typing import Annotated
        annotation = Annotated[Optional[base_type], Field(default=parsed_default, description=description)]
        default = parsed_default

    return annotation, default

async def create_and_register_tool(method_name: str, metadata: Dict[str, Any]) -> bool:
    """Create and register a dynamic tool for a Mathesar RPC method with proper parameter definitions."""
    try:
        # Extract metadata
        summary = metadata.get('parsed_doc', {}).get('summary', f'Call {method_name} method')
        full_description = metadata.get('docstring', summary)
        parameters = metadata.get('parameters', {})
        args_list = metadata.get('args', [])
        parsed_args = metadata.get('parsed_doc', {}).get('args', {})
        characteristics = analyze_method_characteristics(method_name, metadata)

        # Extract additional metadata for richer descriptions
        category = metadata.get('category', '')
        action = metadata.get('action', '')
        return_doc = metadata.get('return_doc', {})
        return_type = return_doc.get('type', '') if return_doc else ''

        # Build enhanced description
        enhanced_description = full_description
        if category and action:
            enhanced_description = f"[{category}.{action}] {enhanced_description}"
        if return_type:
            returns_text = metadata.get('parsed_doc', {}).get('returns', 'Result data')
            enhanced_description += f"\n\nReturns ({return_type}): {returns_text}"

        # Filter out 'kwargs' from parameters as it's a catch-all
        filtered_params = {k: v for k, v in parameters.items() if k != 'kwargs'}
        filtered_args = [arg for arg in args_list if arg != 'kwargs']

        tool_name = method_name.replace('.', '_')

        # If no meaningful parameters, create simple function
        if not filtered_params:
            async def simple_tool():
                logger.debug(f"Calling {method_name} with no params")
                return await make_rpc_call(method_name, {})

            simple_tool.__name__ = tool_name
            simple_tool.__doc__ = enhanced_description
            tool_func = mcp.tool(annotations=characteristics)(simple_tool)
            logger.info(f"Registered simple tool: {tool_name}")
            return True

                # Create function code with proper parameters
        param_annotations = {}
        param_defaults = {}

        for param_name in filtered_args:
            if param_name in filtered_params:
                param_info = filtered_params[param_name]
                annotation, default = create_parameter_annotation(param_name, param_info, parsed_args)
                param_annotations[param_name] = annotation
                if default is not inspect.Parameter.empty:
                    param_defaults[param_name] = default

        # Create the dynamic function with proper signature
        def create_dynamic_function():
            # Create parameter list for function signature
            sig_params = []
            for param_name in filtered_args:
                if param_name in param_annotations:
                    if param_name in param_defaults:
                        param = inspect.Parameter(
                            param_name,
                            inspect.Parameter.KEYWORD_ONLY,
                            default=param_defaults[param_name],
                            annotation=param_annotations[param_name]
                        )
                    else:
                        param = inspect.Parameter(
                            param_name,
                            inspect.Parameter.KEYWORD_ONLY,
                            annotation=param_annotations[param_name]
                        )
                    sig_params.append(param)

            # Create the signature
            signature = inspect.Signature(sig_params)

            # Create the actual function
            async def dynamic_tool_impl(**kwargs):
                # Filter out None values and prepare parameters
                filtered_kwargs = {k: v for k, v in kwargs.items() if v is not None}
                logger.debug(f"Calling {method_name} with params: {list(filtered_kwargs.keys())}")
                return await make_rpc_call(method_name, filtered_kwargs)

            # Set the signature on the function
            dynamic_tool_impl.__signature__ = signature
            dynamic_tool_impl.__name__ = tool_name
            dynamic_tool_impl.__doc__ = enhanced_description

            return dynamic_tool_impl

        # Create and register the function
        dynamic_tool = create_dynamic_function()
        tool_func = mcp.tool(annotations=characteristics)(dynamic_tool)

        logger.info(f"Registered parameterized tool: {tool_name} with {len(filtered_params)} parameters")
        return True

    except Exception as e:
        logger.error(f"Failed to create tool for {method_name}: {e}")
        logger.exception("Full traceback:")
        return False

async def register_dynamic_tools() -> Dict[str, Any]:
    """Register all Mathesar RPC methods as individual MCP tools."""
    auth_error = check_auth_config()
    if auth_error:
        return {"error": auth_error}

    try:
        logger.info("Starting dynamic tool registration...")

        # Get method information using system.introspect_methods
        introspection = await make_rpc_call("system.introspect_methods")

        if isinstance(introspection, dict) and introspection.get("isError"):
            return {"error": f"Introspection failed: {introspection.get('message')}"}

        if not introspection.get("introspection_successful"):
            return {"error": "Introspection was not successful"}

        methods_metadata = introspection.get("methods", {})
        total_methods = len(methods_metadata)
        logger.info(f"Found {total_methods} methods to process")

        # Process methods and register tools
        tools_registered = 0
        failed_methods = []

        for method_name, metadata in methods_metadata.items():
            # Skip certain system methods
            if method_name.startswith('system.') and method_name not in ['system.introspect_methods']:
                continue

            try:
                success = await create_and_register_tool(method_name, metadata)
                if success:
                    tools_registered += 1
                    _registered_tools.add(method_name)
                else:
                    failed_methods.append(method_name)

            except Exception as e:
                failed_methods.append(f"{method_name}: {str(e)}")
                logger.error(f"Exception registering {method_name}: {e}")

        logger.info(f"Registration complete: {tools_registered} tools registered, {len(failed_methods)} failed")

        return {
            "success": True,
            "tools_registered": tools_registered,
            "total_methods": total_methods,
            "failed_methods": failed_methods[:10]
        }

    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        return {"error": str(e)}

@mcp.tool()
async def mathesar_status() -> str:
    """Get the current status of the Mathesar MCP server."""
    auth_error = check_auth_config()
    if auth_error:
        return f"""❌ Mathesar MCP Server Status

🔐 Authentication: Not configured
🛠️ Dynamic Tools: 0 registered
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

    return f"""✅ Mathesar MCP Server Status

🔐 Authentication: ✅ Configured (User: {MATHESAR_USERNAME})
🛠️ Dynamic Tools: {registered_count} registered
🌐 Server URL: {MATHESAR_BASE_URL}
🔗 Connection: {connection_status}

💡 All Mathesar RPC methods are available as individual MCP tools!"""

@mcp.tool()
async def mathesar_register_tools() -> str:
    """Register all available Mathesar RPC methods as individual MCP tools."""
    result = await register_dynamic_tools()

    if result.get("error"):
        return f"❌ Registration failed: {result['error']}"

    tools_registered = result.get("tools_registered", 0)
    total_methods = result.get("total_methods", 0)
    failed_methods = result.get("failed_methods", [])

    status = f"✅ Dynamic tool registration complete!\n\n"
    status += f"📊 Results:\n"
    status += f"- Tools registered: {tools_registered}\n"
    status += f"- Total methods found: {total_methods}\n"
    status += f"- Failed registrations: {len(failed_methods)}\n"

    if failed_methods:
        status += f"\n❌ Failed methods (first 10):\n"
        for method in failed_methods:
            status += f"- {method}\n"

    status += f"\n💡 Use tool names like: mathesar_tables_list, mathesar_records_add, etc."

    return status

# Note: The LLMs strongly prefer using this tool over the dynamic ones if it is enabled.
# I'm not sure why, but it's a good idea to keep it disabled.
#
# @mcp.tool()
# async def mathesar_call_method(
#     method: str,
#     params: Optional[Dict[str, Any]] = None
# ) -> Any:
#     """
#     Call any Mathesar RPC method directly (fallback method).

#     Args:
#         method: The RPC method name (e.g., "tables.list", "records.add")
#         params: Optional parameters for the method as a dictionary

#     Returns:
#         The result of the RPC method call, or an error object
#     """
#     if not method or not isinstance(method, str):
#         return {
#             "error": "Invalid method",
#             "message": "Method must be a non-empty string",
#             "isError": True
#         }

#     return await make_rpc_call(method, params or {})

async def startup():
    """Initialize the server by registering dynamic tools."""
    logger.info("Starting Mathesar MCP Server...")

    auth_error = check_auth_config()
    if auth_error:
        logger.warning(f"Authentication not configured: {auth_error}")
        logger.info("Use mathesar_register_tools() after configuring environment variables")
        return

    # Automatically register tools on startup
    logger.info("Attempting automatic tool registration...")
    result = await register_dynamic_tools()

    if result.get("error"):
        logger.error(f"Automatic registration failed: {result['error']}")
        logger.info("Use mathesar_register_tools() to retry registration")
    else:
        tools_count = result.get("tools_registered", 0)
        logger.info(f"Successfully registered {tools_count} dynamic tools!")

if __name__ == "__main__":
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(startup())
    mcp.run()
