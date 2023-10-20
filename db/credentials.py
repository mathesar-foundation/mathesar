from collections import namedtuple
from sqlalchemy.engine import URL


# Encapsulates information necessary to perform and uniquely identify a
# connection to a Postgres database. More practical than passing that
# information around as 5 separate parameters.
#
# Usable as a cache key when caching database-specific things (like SA engines).
#
# Notice how custom class methods are defined. Whether they're static or not
# has to be inferred, though if a method's docstring doesn't mention it,
# they're probably meant to be instance methods.
DbCredentials = namedtuple(
    'DbCredentials',
    [
        'username',
        'password',
        'hostname',
        'db_name',
        'port'
    ]
)


def _to_sa_url(credentials):
    """
    Converts DbCredentials into SA's URL.
    """
    return URL.create(
        "postgresql",
        username=credentials.username,
        password=credentials.password,
        host=credentials.hostname,
        database=credentials.db_name,
        port=credentials.port,
    )


DbCredentials.to_sa_url = _to_sa_url


def _get_root(credentials):
    """
    Returns a copy of the credentials with the db_name changed to "postgres".

    Useful for when we're doing admin tasks (e.g. create or drop) on the
    database object itself, which can't be done while connected to the database
    that we're manipulating.
    """
    return credentials._replace(db_name="postgres")


DbCredentials.get_root = _get_root


def _from_engine(engine):
    """
    Creates DbCredentials from SA Engine's URL.

    Static method. Probably shouldn't ever be used in production. Can be useful
    in testing.
    """
    url = engine.url
    return DbCredentials(
        username=url.username,
        password=url.password,
        hostname=url.host,
        db_name=url.database,
        port=url.port,
    )


DbCredentials.from_engine = _from_engine
