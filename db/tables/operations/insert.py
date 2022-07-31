from sqlalchemy import select


def insert_from_select(from_table, target_table, engine, mappings=None):
    target_table_col_list = [col for col in target_table.c if col.name != 'id']
    with engine.begin() as conn:
        sel = select([col for col in from_table.c if col.name != 'id'])
        ins = target_table.insert().from_select(target_table_col_list, sel)
        try:
            result = conn.execute(ins)
        except Exception as e:
            # ToDo raise specific exceptions
            raise e
    return target_table, result
