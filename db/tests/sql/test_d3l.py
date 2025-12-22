from db.sql import d3l


def test_get_object_counts(db_conn):
    db_conn.execute(
        """
        CREATE SCHEMA anewone;
        CREATE TABLE anewone.mytab (col1 text);
        CREATE TABLE "12345" (bleh text, bleh2 numeric);
        CREATE TABLE tableno3 (id INTEGER);
        """
    )
    object_counts_result = d3l.get_object_counts.run(db_conn).fetchall()
    assert len(object_counts_result) == 1
    object_counts = object_counts_result[0][0]
    assert object_counts["schema_count"] == 2
    assert object_counts["table_count"] == 3
    assert object_counts["record_count"] is not None
