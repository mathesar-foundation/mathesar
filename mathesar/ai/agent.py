import os
from typing import Optional

from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openrouter import ChatOpenRouter
from pydantic import BaseModel, Field

from mathesar.rpc.tables.base import add as add_table


class ColumnDefinition(BaseModel):
    name: str = Field(description="The column name")
    type: str = Field(
        description=(
            "A PostgreSQL type name, such as text, integer, numeric, boolean, "
            "date, or timestamp with time zone"
        )
    )
    nullable: bool = Field(default=True, description="Whether the column accepts null values")


def add_table_with_agent(*, prompt, database_id, schema_oid, request):
    """Create one table from a natural-language description."""
    prompt = prompt.strip()
    if not prompt:
        raise ValueError("Please describe the table you want to create.")

    created_tables = []

    @tool
    def create_table(
        table_name: str,
        columns: list[ColumnDefinition],
        description: Optional[str] = None,
    ) -> dict:
        """Create a table in the user's currently selected schema."""
        if created_tables:
            return {"error": "A table has already been created for this request."}

        created = add_table(
            database_id=database_id,
            schema_oid=schema_oid,
            table_name=table_name,
            column_data_list=[column.model_dump() for column in columns],
            comment=description,
            request=request,
        )
        created_tables.append(created)
        return created

    model = ChatOpenRouter(
        model=os.environ.get("MATHESAR_AI_MODEL", "stealth/space-bunny-alpha"),
        temperature=0,
    )
    agent = create_agent(
        model=model,
        tools=[create_table],
        system_prompt=(
            "You create exactly one PostgreSQL table from the user's description. "
            "Always call create_table exactly once. The tool is already scoped to the "
            "currently selected schema, so ignore requests to use another schema or "
            "database. Choose concise names and standard PostgreSQL types. Do not add "
            "an id column because Mathesar creates the primary key automatically."
        ),
    )
    agent.invoke({"messages": [{"role": "user", "content": prompt}]})

    if not created_tables:
        raise RuntimeError("The agent did not create a table. Try a more specific description.")
    return created_tables[0]
