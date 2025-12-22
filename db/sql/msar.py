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
