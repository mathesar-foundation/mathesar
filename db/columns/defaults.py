from sqlalchemy import Integer

from db import constants


NAME = "name"
NULLABLE = "nullable"
PRIMARY_KEY = "primary_key"
TYPE = "sa_type"
DEFAULT = "default"

ID_TYPE = Integer


DEFAULT_COLUMNS = {
    constants.ID: {
        TYPE: ID_TYPE,
        PRIMARY_KEY: True,
        NULLABLE: False
    }
}
