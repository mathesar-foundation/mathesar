class DBFunctionException(Exception):
    pass


class BadDBFunctionFormat(DBFunctionException):
    pass


class UnknownDBFunctionID(BadDBFunctionFormat):
    pass


class ReferencedColumnsDontExist(BadDBFunctionFormat):
    pass
