from collections import namedtuple
from sqlalchemy.engine import URL


# Encapsulates information necessary to perform and uniquely identify a
# connection to a Postgres database. More practical than passing that
# information around as 5 separate parameters.
#
# Usable as a cache key when caching database-specific things (like SA engines).
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
