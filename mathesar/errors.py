class InvalidTableError(Exception):
    pass


class URLDownloadError(Exception):
    pass


class URLNotReachable(Exception):
    pass


class UnsupportedFileFormat(Exception):
    pass


class URLInvalidContentTypeError(Exception):
    def __init__(self, content_type, *args):
        self.content_type = content_type
        super().__init__(*args)
