"""
System introspection RPC methods for MCP server integration.
Provides rich metadata about available RPC methods via the modernrpc registry.
"""
import inspect
from typing import Dict, List, Any, Optional
from modernrpc.core import registry, rpc_method


def parse_docstring(docstring: str) -> Dict[str, Any]:
    """Parse a Python docstring to extract structured information."""
    if not docstring:
        return {"summary": "", "args": {}, "returns": "", "examples": []}

    lines = [line.strip() for line in docstring.strip().split('\n')]
    parsed = {
        "summary": "",
        "args": {},
        "returns": "",
        "examples": [],
        "description": ""
    }

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
            current_section = "returns"
        elif line.startswith("Example"):
            current_section = "examples"
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
        elif current_section == "returns":
            parsed["returns"] += line + " "
        elif current_section == "examples":
            parsed["examples"].append(line)

    # If we never hit Args:, the whole thing is summary
    if not parsed["summary"] and summary_lines:
        parsed["summary"] = " ".join(summary_lines)

    parsed["returns"] = parsed["returns"].strip()
    return parsed


def get_method_metadata_from_rpc_method(rpc_method) -> Dict[str, Any]:
    """Extract rich metadata from a modernrpc RPCMethod object."""
    metadata = {
        "method": rpc_method.name,
        "category": rpc_method.name.split('.')[0],
        "action": '.'.join(rpc_method.name.split('.')[1:]),
        "entry_point": rpc_method.entry_point,
        "protocol": str(rpc_method.protocol),
        "source_available": True
    }

    # Get docstring and signature from the RPCMethod
    metadata["docstring"] = rpc_method.raw_docstring
    metadata["signature"] = str(rpc_method)  # RPCMethod.__str__ gives signature

    # Get function signature details
    try:
        sig = inspect.signature(rpc_method.function)
        parameters = {}
        for param_name, param in sig.parameters.items():
            param_info = {
                "type": str(param.annotation) if param.annotation != inspect.Parameter.empty else "Any",
                "default": str(param.default) if param.default != inspect.Parameter.empty else "Required",
                "kind": str(param.kind)
            }
            parameters[param_name] = param_info
        metadata["parameters"] = parameters
    except Exception as e:
        metadata["parameters"] = {}
        metadata["signature_error"] = str(e)

    # Use modernrpc's built-in introspection
    metadata["args"] = rpc_method.args
    metadata["accepts_kwargs"] = rpc_method.accept_kwargs

    # Use modernrpc's built-in doc parsing
    metadata["args_doc"] = dict(rpc_method.args_doc)  # Convert OrderedDict to dict
    metadata["return_doc"] = rpc_method.return_doc

    # Parse the docstring for additional structure
    metadata["parsed_doc"] = parse_docstring(rpc_method.raw_docstring)

    # Get source information if possible
    try:
        metadata["source_file"] = inspect.getfile(rpc_method.function)
        metadata["source_lines"] = inspect.getsourcelines(rpc_method.function)[1]
    except:
        pass

    return metadata


@rpc_method(name="system.introspect_methods")
def introspect_methods() -> Dict[str, Any]:
    """
    Get comprehensive information about all available RPC methods.

    Returns:
        Dictionary containing method information with rich metadata
    """
    try:
        # Get all methods from modernrpc registry
        all_rpc_methods = registry.get_all_methods()

        # Filter for non-system methods (but include this introspection method)
        mathesar_rpc_methods = [
            method for method in all_rpc_methods
            if not method.name.startswith("system.") or method.name == "system.introspect_methods"
        ]

        # Extract metadata for each method
        methods_metadata = {}
        for rpc_method in mathesar_rpc_methods:
            try:
                methods_metadata[rpc_method.name] = get_method_metadata_from_rpc_method(rpc_method)
            except Exception as e:
                methods_metadata[rpc_method.name] = {
                    "method": rpc_method.name,
                    "error": f"Failed to extract metadata: {e}",
                    "category": rpc_method.name.split('.')[0],
                    "action": '.'.join(rpc_method.name.split('.')[1:])
                }

        # Group by category
        categories = {}
        for method_name in methods_metadata.keys():
            category = method_name.split('.')[0]
            if category not in categories:
                categories[category] = []
            categories[category].append(method_name)

        return {
            "total_methods": len(methods_metadata),
            "categories": categories,
            "methods": methods_metadata,
            "introspection_successful": True
        }

    except Exception as e:
        return {
            "introspection_successful": False,
            "error": str(e),
            "total_methods": 0,
            "categories": {},
            "methods": {}
        }


@rpc_method(name="system.get_method_info")
def get_method_info(method_name: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific RPC method.

    Args:
        method_name: The name of the RPC method to get info about

    Returns:
        Detailed method information including docstring, parameters, etc.
    """
    try:
        # Get all methods from registry
        all_methods = registry.get_all_methods()

        # Find the specific method
        target_method = None
        for method in all_methods:
            if method.name == method_name:
                target_method = method
                break

        if not target_method:
            return {
                "error": f"Method '{method_name}' not found",
                "available_methods": [m.name for m in all_methods[:10]]  # First 10 for reference
            }

        # Extract full metadata
        return get_method_metadata_from_rpc_method(target_method)

    except Exception as e:
        return {
            "error": f"Failed to get method info: {e}",
            "method": method_name
        }


@rpc_method(name="system.get_method_examples")
def get_method_examples(method_name: str) -> Dict[str, Any]:
    """
    Get usage examples for a specific RPC method.

    Args:
        method_name: The name of the RPC method to get examples for

    Returns:
        Usage examples and parameter templates
    """
    # Get method info first
    method_info = get_method_info(method_name)

    if "error" in method_info:
        return method_info

    examples = {
        "method": method_name,
        "basic_usage": f"Call method '{method_name}' with parameters",
        "parameters": method_info.get("parameters", {}),
        "docstring_examples": method_info.get("parsed_doc", {}).get("examples", [])
    }

    # Add method-specific examples based on the method name
    if method_name == "explorations.run":
        examples["detailed_example"] = {
            "description": "Run an exploration to query data",
            "parameters": {
                "exploration_def": {
                    "database_id": 3,
                    "base_table_oid": 19575,
                    "initial_columns": [
                        {"attnum": 2, "alias": "Employee Name"},
                        {"attnum": 3, "alias": "Role"}
                    ],
                    "joins": [],
                    "transformations": []
                },
                "limit": 100,
                "offset": 0
            }
        }
    elif method_name == "records.list":
        examples["detailed_example"] = {
            "description": "List records from a table",
            "parameters": {
                "table_oid": 19575,
                "database_id": 3,
                "limit": 10,
                "offset": 0
            }
        }
    elif method_name == "tables.list":
        examples["detailed_example"] = {
            "description": "List tables in a schema",
            "parameters": {
                "schema_oid": 19574,
                "database_id": 3
            }
        }

    return examples


@rpc_method(name="system.browse_categories")
def browse_categories() -> Dict[str, List[str]]:
    """
    Browse available RPC methods organized by category.

    Returns:
        Dictionary with categories as keys and method lists as values
    """
    try:
        all_methods = registry.get_all_methods()

        categories = {}
        for method in all_methods:
            # Skip system methods except introspection ones
            if method.name.startswith("system.") and not method.name.startswith("system.introspect") and not method.name.startswith("system.get_") and not method.name.startswith("system.browse_"):
                continue

            category = method.name.split('.')[0]
            if category not in categories:
                categories[category] = []
            categories[category].append(method.name)

        # Sort for better presentation
        for category in categories:
            categories[category].sort()

        return dict(sorted(categories.items()))

    except Exception as e:
        return {"error": f"Failed to browse categories: {e}"}
