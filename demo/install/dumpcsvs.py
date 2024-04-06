"""
Dump data for all the tables of a provided schema to separate {table_name}.csv files
with header as column names.

Usage: python dumpcsvs.py
"""
import psycopg
import csv

DB_NAME = "mathesar"
DB_USER = "mathesar"
DB_PASSWORD = "mathesar"
DB_HOST = "mathesar_dev_db"
SCHEMA_NAME = "Movie Collection"

conn = psycopg.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=5432
)

# get names of tables.
tables = conn.execute(
    f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{SCHEMA_NAME}'"
).fetchall()

for table in tables:
    table_name = table[0]
    with open(f'{table_name}.csv', 'w', newline="") as csv_file:
        csv_writer = csv.writer(csv_file)
        columns = conn.execute(
            f"""SELECT column_name FROM information_schema.columns WHERE
            table_schema = '{SCHEMA_NAME}' AND table_name = '{table_name}';"""
        ).fetchall()
        columns = [column[0] for column in columns]
        csv_writer.writerow(columns)
        with conn.cursor().copy(f"""COPY "{SCHEMA_NAME}"."{table_name}" TO STDOUT""") as copy:
            csv_writer.writerows(copy.rows())
