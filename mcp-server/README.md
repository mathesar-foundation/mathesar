# Mathesar MCP Server (Work In Progress)

A Model Context Protocol (MCP) server that provides access to Mathesar database operations through category-based tools.

## Overview

This MCP server registers Mathesar RPC methods as organized category tools (tables, records, columns, schemas, etc.) instead of individual tools for each method.

This approach keeps the tool count manageable while providing full access to Mathesar's functionality.

## Features

- **Automatic Tool Registration**: Dynamically discovers and registers available RPC methods
- **Category-Based Organization**: Groups related RPC methods into logical categories

## Installation

This project uses [UV](https://docs.astral.sh/uv/).

1. Install UV (if you haven't already):
   ```shell
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
2. Install project dependencies:
   ```shell
   cd mcp-server
   uv sync
   ```
3. Run Mathesar locally
4. Login to Mathesar in your browser, and grab the CSRF token and session ID from developer tools.
5. Add the MCP Server config to [Cursor](https://docs.cursor.com/context/model-context-protocol#configuring-mcp-servers), [VS Code (i have not tested this)](https://code.visualstudio.com/docs/copilot/chat/mcp-servers), etc.
    ```json
   {
     "mcpServers": {
       "mathesar": {
         "description": "Mathesar MCP server",
         "command": "uv",
         "args": [
           "--directory",
           "/path/to/mathesar/mcp-server",
           "run",
           "server.py"
         ],
         "env": {
           "MATHESAR_BASE_URL": "http://localhost:8000",
           "MATHESAR_USERNAME": "admin",
           "MATHESAR_PASSWORD": "password",
           "MATHESAR_CSRF_TOKEN": "yours-here",
           "MATHESAR_SESSION_ID": "yours-here"
         }
       }
     }
   }

   ```
