from sqlalchemy import Integer

from db import constants


NAME = "name"
DESCRIPTION = "description"
NULLABLE = "nullable"
PRIMARY_KEY = "primary_key"
TYPE = "sa_type"
DEFAULT = "default"
AUTOINCREMENT = "autoincrement"

ID_TYPE = Integer


DEFAULT_COLUMNS = {
    constants.ID: {
        TYPE: ID_TYPE,
        PRIMARY_KEY: True,
        NULLABLE: False,
        AUTOINCREMENT: True
    }
}
