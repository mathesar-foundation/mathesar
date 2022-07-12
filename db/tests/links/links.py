# from db.columns.base import MathesarColumn
# from alembic.migration import MigrationContext
# from alembic.operations import Operations
# from sqlalchemy import MetaData
#
# from db.constraints.utils import naming_convention
# from db.schemas.operations.select import reflect_schema
# from db.tables.operations.create import create_mathesar_table
# from db.tables.operations.select import get_table_oids_from_schema
#
# from db.tests.types import fixtures
#
# from db.types.operations.cast import get_supported_alter_column_types
#
# engine_with_types = fixtures.engine_with_types
# engine_email_type = fixtures.engine_email_type
# temporary_testing_schema = fixtures.temporary_testing_schema
#
#
# def test_table_creation(engine_with_schema):
#     engine, schema = engine_with_schema
#     supported_types = get_supported_alter_column_types(
#         engine, friendly_names=False,
#     )
#     sa_type = supported_types.get("INTEGER")
#     metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
#     with engine.begin() as conn:
#         metadata.reflect()
#         opts = {
#             'target_metadata': metadata
#         }
#         ctx = MigrationContext.configure(conn, opts=opts)
#         referent_column = MathesarColumn(
#             "reference",
#             sa_type()
#         )
#         target_table = create_mathesar_table(
#             "target_table",
#             schema,
#             [referent_column],
#             engine,
#             metadata,
#         )
#         fk_column = MathesarColumn(
#             "fk_col",
#             sa_type()
#         )
#         base_table = create_mathesar_table(
#             "base_table",
#             schema,
#             [fk_column],
#             engine,
#             metadata
#         )
#         op = Operations(ctx)
#         # op.create_unique_constraint(None, target_table.name, [referent_column.name], schema=schema)
#         try:
#             op.create_foreign_key(
#                 None, base_table.name,
#                 target_table.name,
#                 [fk_column.name], [referent_column.name], source_schema=schema, referent_schema=schema
#             )
#         except:
#             pass
#     schema_obj = reflect_schema(engine, schema)
#     tables = get_table_oids_from_schema(schema_obj.oid, engine)
#     assert len(tables) == 0
