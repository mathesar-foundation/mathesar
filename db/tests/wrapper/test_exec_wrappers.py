import ast
import os

import psycopg
from psycopg import sql
import pytest


@pytest.fixture(scope="session")
def psycopg_connection(engine):
    """
    Returns a psycopg connection that can be used for during testing.
    """
    return psycopg.connect(str(engine.url))


@pytest.fixture(scope="session")
def get_msar_func_names(psycopg_connection):
    """
    Returns a map of all installed msar function names along with the number of input arguments that can be passed to them.
    The map has the following form:
    {
        'name_of_sql_func_on_db': [count_of_args_it_can_take_as_input(s)],
        [...]
    }
    """
    query = sql.SQL(
        """
        WITH cte AS (
        SELECT proname AS name, jsonb_agg(pronargs) AS args
        FROM pg_proc WHERE pronamespace = 'msar'::regnamespace
        GROUP BY proname
        ) SELECT jsonb_object_agg(cte.name, cte.args) FROM cte;
        """
    )
    msar_func_args_count_map = {}
    with psycopg_connection as conn:
        msar_func_args_count_map = conn.execute(query).fetchone()[0]
    return msar_func_args_count_map


def find_exec_calls_in_project(directory):
    """
    Returns a list of tuples specifing all the python function calling exec_msar_func in a given directory.
    Each tuple has the following form:
        ('name_of_python_function', 'name_of_sql_function_in_exec_call', count_of_args_for_sql_function_in_exec_call), [...]
    """
    def find_exec_calls_in_file(filepath):
        exec_calling_functions = []

        with open(filepath, "rb") as file:
            tree = ast.parse(file.read(), filename=filepath)

        class ExecCallVisitor(ast.NodeVisitor):
            def visit_Call(self, node):
                if (
                    isinstance(node.func, ast.Name)
                    and node.func.id == "exec_msar_func"
                ) or (
                    isinstance(node.func, ast.Attribute)
                    and node.func.attr == "exec_msar_func"
                ):
                    # Traverse the tree to find the function this call is within
                    current = node
                    while current:
                        if isinstance(current, ast.FunctionDef):
                            # len(node.args) - 2 to remove `conn` and `sql function name` from the arg count
                            exec_calling_functions.append((current.name, node.args[1].value, len(node.args) - 2))
                            break
                        current = getattr(current, "parent", None)
                self.generic_visit(node)
        for node in ast.walk(tree):
            for child in ast.iter_child_nodes(node):
                child.parent = node
        ExecCallVisitor().visit(tree)
        return exec_calling_functions

    all_exec_calling_functions = []
    for subdir, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(subdir, file)
                exec_calling_functions = find_exec_calls_in_file(filepath)
                all_exec_calling_functions.extend(exec_calling_functions)
    return all_exec_calling_functions


@pytest.mark.parametrize("_,exec_sql_func_name,exec_sql_arg_count", find_exec_calls_in_project("db/"))
def test_db_wrapper(get_msar_func_names, _, exec_sql_func_name, exec_sql_arg_count):
    """Tests to make sure every SQL function is correctly wired up."""
    if exec_sql_func_name != 'drop_all_msar_objects':
        assert exec_sql_func_name in get_msar_func_names.keys()
        assert exec_sql_arg_count in get_msar_func_names[exec_sql_func_name]


def test_no_exec_calls_from_mathesar():
    """Test to ensure that we never have a call to exec_msar_func from mathesar/"""
    assert len(find_exec_calls_in_project("mathesar/")) == 0
