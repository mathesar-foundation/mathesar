import os

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
FUNCTIONS_DIR = os.path.join(FILE_DIR, "functions")

class MathesarObject:

    def __init__(self, dependencies=[], name="", code_path=""):
        self._dependencies = dependencies
        self._name = name
        self._code_path = code_path

    @property
    def code(self):
        with open(self._code_path, 'rt') as f:
            return f.read()

    @property
    def dependencies(self):
        deps = []
        for d in self._dependencies:
            deps.extend(d.dependencies)
        return list(dict.fromkeys(deps + [self]))

    def install(self, conn):
        for d in self.dependencies:
            conn.execute(d.code)


class MathesarFunction(MathesarObject):

    def run(self, conn, *args):
        with conn.pipeline():
            self.install(conn)
            result = conn.execute(
                f"SELECT pg_temp.{self._name}({','.join(['%s'] * len(args))});",
                args
            )
        return result


get_constraint_type_api_code = MathesarFunction(
    dependencies = [],
    name = "get_constraint_type_api_code",
    code_path=os.path.join(FUNCTIONS_DIR, "get_constraint_type_api_code.sql")
) 

get_constraints_for_table = MathesarFunction(
    dependencies = [get_constraint_type_api_code],
    name = "get_constraints_for_table",
    code_path=os.path.join(FUNCTIONS_DIR, "get_constraint_type_api_code.sql")
)

