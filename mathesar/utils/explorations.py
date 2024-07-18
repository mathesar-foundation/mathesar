from mathesar.models.base import Explorations
from db.queries.base import DBQuery, InitialColumn, JoinParameter
from db.engine import create_future_engine_with_custom_types
from mathesar.state import get_cached_metadata


def get_explorations(database_id):
    return Explorations.objects.filter(database__id=database_id)


def delete_exploration(exploration_id):
    Explorations.objects.get(id=exploration_id).delete()


def run_exploration(exploration_def, conn):
    engine = create_future_engine_with_custom_types(
        conn.info.user,
        conn.info.password,
        conn.info.host,
        conn.info.dbname,
        conn.info.port
    )
    initial_columns = exploration_def.get('initial_columns')
    processed_initial_columns = []
    for column in initial_columns:
        jp_path = column.get("join_path")
        if jp_path is not None:
            join_path = [
                JoinParameter(
                    left_oid=i[0][0],
                    left_attnum=i[0][1],
                    right_oid=i[1][0],
                    right_attnum=i[1][1]
                ) for i in jp_path
            ]
        processed_initial_columns.append(
            InitialColumn(
                reloid=column["table_oid"],
                attnum=column["attnum"],
                alias=column["alias"],
                jp_path=join_path
            )
        )
    db_query = DBQuery(
        base_table_oid=exploration_def["base_table_oid"],
        initial_columns=processed_initial_columns,
        engine=engine,
        transformations=exploration_def.get("transformations", []),
        name=None,
        metadata=get_cached_metadata()
    )
    return {
        "query": (),
        "records": db_query.get_records(),
        "output_columns": (),
        "column_metadata": (),
        "parameters": {},
    }

# {
#     "base_table": 7,
#     "initial_columns": [
#         {
#             "id": 13,
#             "alias": "Checkouts_Item"
#         },
#         { 
#             "id": 6,
#             "alias": "Books_Page Count",
#             "join_path": [
#                 [
#                     13,
#                     29
#                 ],
#                 [
#                     20,
#                     27
#                 ]
#             ]
#         }
#     ],
#     "transformations": [],
#     "display_names": {
#         "Checkouts_Item": "Checkouts_Item",
#         "Books_Page Count": "Books_Page Count"
#     },
#     "parameters": {
#         "limit": 100,
#         "offset": 0 
#     }
# }
