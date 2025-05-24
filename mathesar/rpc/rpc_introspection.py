"""
RPC introspection methods for MCP server integration.
Provides metadata about available RPC methods via the modernrpc registry.
"""
import inspect
from typing import Dict, Any
from modernrpc.core import registry
from mathesar.rpc.decorators import mathesar_rpc_method


def parse_docstring(docstring: str) -> Dict[str, Any]:
    """Parse a Python docstring to extract summary and args for MCP server."""
    if not docstring:
        return {"summary": "", "args": {}}

    lines = [line.strip() for line in docstring.strip().split('\n')]
    parsed = {"summary": "", "args": {}}

    current_section = "summary"
    current_arg = None
    summary_lines = []

    for line in lines:
        if not line:
            continue

        if line.startswith("Args:"):
            current_section = "args"
            if summary_lines:
                parsed["summary"] = " ".join(summary_lines)
        elif line.startswith("Returns:"):
            break  # Stop parsing after Returns section
        elif current_section == "summary":
            summary_lines.append(line)
        elif current_section == "args":
            if ":" in line and not line.startswith(" "):
                # New argument: "arg_name: description"
                parts = line.split(":", 1)
                arg_name = parts[0].strip()
                arg_desc = parts[1].strip() if len(parts) > 1 else ""
                parsed["args"][arg_name] = arg_desc
                current_arg = arg_name
            elif current_arg and line:
                # Continuation of argument description
                parsed["args"][current_arg] += " " + line

    # If we never hit Args:, the whole thing is summary
    if not parsed["summary"] and summary_lines:
        parsed["summary"] = " ".join(summary_lines)

    return parsed


def get_method_metadata(rpc_method) -> Dict[str, Any]:
    """Extract minimal metadata needed by MCP server."""
    # Get function signature details for MCP server
    parameters = {}
    try:
        sig = inspect.signature(rpc_method.function)
        for param_name, param in sig.parameters.items():
            param_info = {
                "type": str(param.annotation) if param.annotation != inspect.Parameter.empty else "Any",
                "default": str(param.default) if param.default != inspect.Parameter.empty else "Required",
            }
            parameters[param_name] = param_info
    except Exception:
        pass

    return {
        "args": rpc_method.args,  # Used by MCP server
        "parameters": parameters,  # Used by MCP server
        "parsed_doc": parse_docstring(rpc_method.raw_docstring)  # Used by MCP server (.args and .summary)
    }


@mathesar_rpc_method(name="system.introspect_methods", auth="login")
def introspect_methods() -> Dict[str, Any]:
    """
    Get information about all available RPC methods for MCP server integration.

    Returns:
        Dictionary containing method information with metadata needed by MCP server
    """
    try:
        # Get all methods from modernrpc registry
        all_rpc_methods = registry.get_all_methods()

        # Filter for non-system methods (but include this introspection method)
        mathesar_rpc_methods = [
            method for method in all_rpc_methods
            if not method.name.startswith("system.") or method.name == "system.introspect_methods"
        ]

        # Extract minimal metadata for each method
        methods_metadata = {}
        for rpc_method in mathesar_rpc_methods:
            try:
                methods_metadata[rpc_method.name] = get_method_metadata(rpc_method)
            except Exception as e:
                methods_metadata[rpc_method.name] = {
                    "error": f"Failed to extract metadata: {e}",
                    "args": [],
                    "parameters": {},
                    "parsed_doc": {"summary": "", "args": {}}
                }

        return {
            "total_methods": len(methods_metadata),
            "methods": methods_metadata,
            "introspection_successful": True
        }

    except Exception as e:
        return {
            "introspection_successful": False,
            "error": str(e),
            "total_methods": 0,
            "methods": {}
        }
