class BadDbFunctionFormat(Exception):
    pass


class UnknownDbFunctionId(BadDbFunctionFormat):
    pass


class ReferencedColumnsDontExist(BadDbFunctionFormat):
    pass
