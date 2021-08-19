from sqlalchemy import types as sa_types
from sqlalchemy.ext.compiler import compiles


class TIME(sa_types.TypeDecorator):
    impl = sa_types.TIME

    def __init__(self, *args, precision=None, **kwargs):
        self.precision = precision
        super().__init__(*args, **kwargs)


@compiles(TIME, "postgresql")
def compile_time_precision(element, compiler, **kwargs):
    stmt = "TIME"
    if element.precision is not None:
        stmt += f"({element.precision})"
    if element.timezone:
        stmt += " WITH TIME ZONE"
    return stmt
