class BadDBFunctionFormat(Exception):
    pass


class UnknownDBFunctionId(BadDBFunctionFormat):
    pass


class ReferencedColumnsDontExist(BadDBFunctionFormat):
    pass
