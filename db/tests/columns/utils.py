from datetime import date

from sqlalchemy import String, Integer, Boolean, Date, select, Table, MetaData


column_test_dict = {
    Integer: {"start": "0", "set": "5", "expt": 5},
    String: {"start": "default", "set": "test", "expt": "test"},
    Boolean: {"start": "false", "set": "true", "expt": True},
    Date: {"start": "2019-01-01", "set": "2020-01-01", "expt": date(2020, 1, 1)}
}


def create_test_table(table_name, cols, insert_data, schema, engine):
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        *cols
    )
    table.create()
    with engine.begin() as conn:
        for data in insert_data:
            conn.execute(table.insert().values(data))
    return table


def get_default(engine, table):
    with engine.begin() as conn:
        conn.execute(table.insert())
        return conn.execute(select(table)).fetchall()[0][0]
