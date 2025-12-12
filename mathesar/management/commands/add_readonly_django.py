from getpass import getpass
from django.core.management.base import BaseCommand
from psycopg import sql
from config.database_config import get_internal_database_config
from db.connection import mathesar_connection


class Command(BaseCommand):
    help = "Set up a DB role for Django that can't modify models"

    def add_arguments(self, parser):
        parser.add_argument(
            "rolename", nargs=1, type=str,
            help="The role to add. Should not yet exist on the database."
        )

    def handle(self, *args, **options):
        rolename = options["rolename"][0]
        password = getpass(prompt="Set a password for the role: ")
        confpass = getpass(prompt="Confirm the password: ")
        assert password == confpass
        conn_info = get_internal_database_config()

        with mathesar_connection(
                host=conn_info.host,
                port=conn_info.port,
                dbname=conn_info.dbname,
                user=conn_info.role,
                password=conn_info.password,
                application_name="mathesar.management.commands.add_readonly_django"
        ) as conn:
            conn.execute(
                sql.SQL(
                    """
                    CREATE USER {rolename} WITH PASSWORD {password};
                    GRANT USAGE ON SCHEMA public TO {rolename};
                    GRANT SELECT ON ALL TABLES IN SCHEMA public TO {rolename};
                    GRANT ALL ON TABLE django_session TO {rolename};
                    GRANT ALL (last_login) ON TABLE mathesar_user TO {rolename};
                    """
                ).format(
                    rolename=sql.Identifier(rolename),
                    password=sql.Literal(password),
                )
            )
