from collections import namedtuple


ExceptionBody = namedtuple('ExceptionBody',
                           ['code', 'message', 'field', 'details'],
                           defaults=[None, None]
                           )
