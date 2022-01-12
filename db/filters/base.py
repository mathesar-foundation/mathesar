from sqlalchemy_filters.exceptions import BadFilterFormat as SABadFilterFormat


class BadFilterFormat(SABadFilterFormat):
    pass


class UnknownPredicateType(BadFilterFormat):
    pass


class ReferencedColumnsDontExist(BadFilterFormat):
    pass
