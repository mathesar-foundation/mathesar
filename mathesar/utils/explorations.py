from db.engine import create_future_engine_with_custom_types
from db.records.operations.select import get_count
from db.queries.base import DBQuery, InitialColumn, JoinParameter
from db.queries.operations.process import get_transforms_with_summarizes_speced
from db.tables.operations.select import get_table
from db.transforms.operations.deserialize import deserialize_transformation
from mathesar.api.utils import process_annotated_records
from mathesar.models.base import Explorations, ColumnMetaData, Database
from mathesar.rpc.columns.metadata import ColumnMetaDataRecord
from mathesar.state import get_cached_metadata


def list_explorations(database_id):
    return Explorations.objects.filter(database__id=database_id)


def get_exploration(exploration_id):
    return Explorations.objects.get(id=exploration_id)


def delete_exploration(exploration_id):
    Explorations.objects.get(id=exploration_id).delete()


def replace_exploration(new_exploration):
    Explorations.objects.filter(id=new_exploration["id"]).update(
        database=Database.objects.get(id=new_exploration["database_id"]),
        name=new_exploration["name"],
        base_table_oid=new_exploration["base_table_oid"],
        schema_oid=new_exploration["schema_oid"],
        initial_columns=new_exploration["initial_columns"],
        transformations=new_exploration.get("transformations"),
        display_options=new_exploration.get("display_options"),
        display_names=new_exploration.get("display_names", {}),
        description=new_exploration.get("description")
    )
    return get_exploration(new_exploration["id"])


def create_exploration(exploration_def):
    return Explorations.objects.create(
        database=Database.objects.get(id=exploration_def["database_id"]),
        name=exploration_def["name"],
        base_table_oid=exploration_def["base_table_oid"],
        schema_oid=exploration_def["schema_oid"],
        initial_columns=exploration_def["initial_columns"],
        transformations=exploration_def.get("transformations"),
        display_options=exploration_def.get("display_options"),
        display_names=exploration_def.get("display_names", {}),
        description=exploration_def.get("description")
    )


def run_exploration(exploration_def, conn, limit=100, offset=0):
    engine = create_future_engine_with_custom_types(
        conn.info.user,
        conn.info.password,
        conn.info.host,
        conn.info.dbname,
        conn.info.port
    )
    metadata = get_cached_metadata()
    base_table_oid = exploration_def["base_table_oid"]
    initial_columns = exploration_def['initial_columns']
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
                reloid=jp_path[-1][-1][0] if jp_path else base_table_oid,
                attnum=column["attnum"],
                alias=column["alias"],
                jp_path=join_path if jp_path else None
            )
        )
    transformations = tuple(
        deserialize_transformation(i)
        for i in exploration_def.get("transformations", [])
    )
    db_query = DBQuery(
        base_table_oid=base_table_oid,
        initial_columns=processed_initial_columns,
        engine=engine,
        transformations=transformations,
        name=None,
        metadata=metadata
    )
    transformations = get_transforms_with_summarizes_speced(db_query, engine, metadata)
    db_query.transformations = transformations
    records = db_query.get_records(
        limit=limit,
        offset=offset
    )
    processed_records = process_annotated_records(records)[0]
    column_metadata = _get_exploration_column_metadata(
        exploration_def,
        processed_initial_columns,
        db_query,
        conn,
        engine,
        metadata
    )
    return {
        "query": exploration_def,
        "records": {
            "count": get_count(
                table=db_query.transformed_relation,
                engine=engine,
                filter=exploration_def.get('filter', None)
            ),
            "results": processed_records
        },
        "output_columns": tuple(sa_col.name for sa_col in db_query.sa_output_columns),
        "column_metadata": column_metadata,
        "limit": limit,
        "offset": offset
    }


def run_saved_exploration(exp_model, limit, offset, conn):
    exploration_def = {
        "database_id": exp_model.database.id,
        "base_table_oid": exp_model.base_table_oid,
        "initial_columns": exp_model.initial_columns,
        "display_names": exp_model.display_names,
        "transformations": exp_model.transformations,
    }
    return run_exploration(exploration_def, conn, limit, offset)


def _get_exploration_column_metadata(
    exploration_def,
    processed_initial_columns,
    db_query,
    conn,
    engine,
    metadata
):
    exploration_column_metadata = {}
    for alias, sa_col in db_query.all_sa_columns_map.items():
        initial_column = None
        for col in processed_initial_columns:
            if alias == col.alias:
                initial_column = col
        column_metadata = ColumnMetaData.objects.filter(
            database__id=exploration_def["database_id"],
            table_oid=initial_column.reloid,
            attnum=sa_col.column_attnum
        ).first() if initial_column else None
        input_table_name = get_table(initial_column.reloid, conn)["name"] if initial_column else None
        input_column_name = initial_column.get_name(engine, metadata) if initial_column else None
        display_names = exploration_def.get("display_names", None)
        exploration_column_metadata[alias] = {
            "alias": alias,
            "display_name": display_names.get(alias) if display_names is not None else None,
            "type": sa_col.db_type.id,
            "type_options": sa_col.type_options,
            "metadata": ColumnMetaDataRecord.from_model(column_metadata) if column_metadata else None,
            "is_initial_column": True if initial_column else False,
            "input_column_name": input_column_name,
            "input_table_name": input_table_name,
            "input_table_id": initial_column.reloid if initial_column else None,
            "input_alias": db_query.get_input_alias_for_output_alias(alias)
        }
    return exploration_column_metadata
