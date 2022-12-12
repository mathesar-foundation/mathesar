from sqlalchemy import cast


class HasUnderlyingType:
    """
    We apply this mixin and its `underlying_type` attribute to a custom SQLAlchemy type to designate
    what its underlying SQLAlchemy type is. We do this, because our custom types misbehave in some
    cases (e.g. array aggregation), and so, in those cases, we cast them to what we consider the
    underlying type. Can also be thought of as the fallback type. For example, for URIs we fallback
    to TEXT, and for Money we fallback to NUMERIC.

    Note, doesn't use ABC, because its metaclasses clash with SQLAlchemy's metaclasses. Workaround
    possible, but seemed burdensome.
    """

    # This attribute is expected to hold an SQLAlchemy type, like `sqlalchemy.NUMERIC`.
    # Would make sense for this to be a `db.types.base.DatabaseType`, but to get the SA type
    # class mapped to its instance (via `get_sa_class`) regrettably requires an engine, which is
    # inappropriate here. That's pretty much a bug, and can be fixed, but might not be worth the
    # effort.
    underlying_type = None

    def downcast_to_underlying_type(self, column_expr):
        #TODO remove
        print("HasUnderlyingType.downcast_to_underlying_type")
        print((column_expr.type, self.underlying_type))
        return cast(column_expr, self.underlying_type)
