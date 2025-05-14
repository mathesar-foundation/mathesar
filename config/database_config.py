from abc import ABC, abstractmethod
from dataclasses import dataclass, field, replace
from typing import Optional, Mapping, Any, Dict
from psycopg import conninfo

from django.conf import settings


POSTGRES_ENGINE = "django.db.backends.postgresql"


# Refer Django docs: https://docs.djangoproject.com/en/4.2/ref/settings/#databases
# Inspiration: https://github.com/jazzband/dj-database-url/blob/master/dj_database_url/__init__.py
# We do not use dj-database-url directly due to a bug with it's parsing logic when unix sockets
# are involved.
# Following class only contains a subset of the available django configurations.
@dataclass(frozen=True)
class DBConfig(ABC):
    dbname: str
    engine: str
    host: Optional[str] = None
    port: Optional[int] = None
    role: Optional[str] = None
    password: Optional[str] = field(default=None, repr=False)
    options: Mapping[str, Any] = field(default_factory=dict)
    atomic_requests: Optional[bool] = None
    autocommit: Optional[bool] = None
    conn_max_age: Optional[int] = 0
    conn_health_checks: Optional[bool] = False
    disable_server_side_cursors: Optional[bool] = False
    time_zone: Optional[str] = None

    @classmethod
    @abstractmethod
    def from_connection_string(cls, url: str) -> "DBConfig":
        """
        Parse a database URL into a DBConfig instance.
        Must be implemented by subclasses.
        """
        raise NotImplementedError

    @classmethod
    def from_django_dict(cls, cfg: Mapping[str, Any]) -> "DBConfig":
        """
        Create DBConfig instance from a Django DATABASES dict
        """
        missing = {"ENGINE", "NAME"} - set(cfg.keys())
        if missing:
            raise ValueError(f"DBConfig.from_dict missing required fields: {missing}")

        return cls(
            engine=cfg["ENGINE"],
            dbname=cfg["NAME"],
            host=cfg.get("HOST"),
            port=parse_port(cfg.get("PORT")),
            role=cfg.get("USER"),
            password=cfg.get("PASSWORD"),
            options=cfg.get("OPTIONS", {}).copy(),
            atomic_requests=cfg.get("ATOMIC_REQUESTS"),
            autocommit=cfg.get("AUTOCOMMIT"),
            conn_max_age=cfg.get("CONN_MAX_AGE"),
            conn_health_checks=cfg.get("CONN_HEALTH_CHECKS"),
            disable_server_side_cursors=cfg.get("DISABLE_SERVER_SIDE_CURSORS"),
            time_zone=cfg.get("TIME_ZONE"),
        )

    def to_django_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "ENGINE": self.engine,
            "NAME": self.dbname,
        }
        if self.host is not None:
            result["HOST"] = self.host
        if self.port is not None:
            result["PORT"] = str(self.port)
        if self.role is not None:
            result["USER"] = self.role
        if self.password is not None:
            result["PASSWORD"] = self.password
        if self.atomic_requests is not None:
            result["ATOMIC_REQUESTS"] = self.atomic_requests
        if self.autocommit is not None:
            result["AUTOCOMMIT"] = self.autocommit
        if self.conn_max_age is not None:
            result["CONN_MAX_AGE"] = self.conn_max_age
        if self.conn_health_checks is not None:
            result["CONN_HEALTH_CHECKS"] = self.conn_health_checks
        if self.disable_server_side_cursors is not None:
            result["DISABLE_SERVER_SIDE_CURSORS"] = self.disable_server_side_cursors
        if self.time_zone is not None:
            result["TIME_ZONE"] = self.time_zone
        if self.options:
            result["OPTIONS"] = dict(self.options)
        return result


# Reference: https://docs.djangoproject.com/en/4.2/ref/databases/#postgresql-notes
# Options are merged from values passed to the class, only sslmode is explicitly handled here.
@dataclass(frozen=True)
class PostgresConfig(DBConfig):
    engine: str = POSTGRES_ENGINE
    sslmode: Optional[str] = None

    # Inject sslmode into OPTIONS
    # https://www.postgresql.org/docs/current/libpq-ssl.html#LIBPQ-SSL-PROTECTION
    # TODO: Avoid doing this in the frozen class, find a better way.
    def __post_init__(self) -> None:
        base_opts = dict(self.options)
        if self.sslmode is not None:
            base_opts["sslmode"] = self.sslmode
        object.__setattr__(self, "options", base_opts)

    @classmethod
    def from_connection_string(cls, url: str) -> "PostgresConfig":
        ci = conninfo.make_conninfo(url)
        params = ci.get_parameters()
        dbname = params.get("dbname")
        if not dbname:
            raise ValueError("PostgresConfig.from_connection_string: missing database name in URL")

        return cls(
            dbname=dbname,
            host=params.get("host"),
            port=parse_port(params.get("port")),
            role=params.get("user"),
            password=params.get("password"),
            sslmode=params.get("sslmode"),
        )

    @classmethod
    def from_django_dict(cls, cfg: Mapping[str, Any]) -> "PostgresConfig":
        raw_opts = cfg.get("OPTIONS", {}).copy()
        sslmode = raw_opts.pop("sslmode", None)
        base_cfg = dict(cfg, OPTIONS=raw_opts)
        base = super().from_django_dict(base_cfg)
        return replace(base, sslmode=sslmode)


def get_internal_database_config():
    conn_info = settings.DATABASES.get("default")
    if not conn_info:
        raise KeyError("settings.DATABASES['default'] is not defined")
    engine = conn_info.get("ENGINE")
    if engine == POSTGRES_ENGINE:
        return PostgresConfig.from_django_dict(conn_info)
    raise NotImplementedError(f"Database engine '{engine}' is not supported")


def parse_port(raw_port):
    port = None
    if raw_port not in (None, ""):
        try:
            port = int(raw_port)
        except (TypeError, ValueError):
            raise ValueError(f"Invalid PORT value: {raw_port!r}")
    return port
