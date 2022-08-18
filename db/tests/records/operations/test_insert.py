from db.records.operations.insert import insert_from_select
from db.records.operations.select import get_records


def test_insert_from_select_without_mappings(books_table_import_from_obj, books_table_import_target_obj):
    # We need engine of the from_table since insert_from_select() is set-up from the 'from_table' side
    from_table, engine = books_table_import_from_obj
    target_table, _ = books_table_import_target_obj
    records_without_mappings = [
        (1, 'Steve Jobs', 'Walter Issacson'),
        (2, 'The Idiot', 'Fyodor Dostevsky'),
        (3, 'David Copperfield', 'Charles Darwin'),
        (4, 'Fyodor Dostoevsky', 'Crime and Punishment'),
        (5, 'Cervantes', 'Don Quixote')
    ]
    res_table, _ = insert_from_select(from_table, target_table, engine, col_mappings=None)
    records = get_records(res_table, engine)
    assert res_table.c['id'] == target_table.c[0]
    assert res_table.c['title'] == target_table.c[1]
    assert res_table.c['author'] == target_table.c[2]
    assert records == records_without_mappings


def test_insert_from_select_with_mappings(books_table_import_from_obj, books_table_import_target_obj):
    # We need engine of the from_table since insert_from_select() is set-up from the 'from_table' side
    from_table, engine = books_table_import_from_obj
    target_table, _ = books_table_import_target_obj
    records_with_mappings = [
        (1, 'Steve Jobs', 'Walter Issacson'),
        (2, 'The Idiot', 'Fyodor Dostevsky'),
        (3, 'David Copperfield', 'Charles Darwin'),
        (4, 'Crime and Punishment', 'Fyodor Dostoevsky'),
        (5, 'Don Quixote', 'Cervantes')
    ]
    col_mappings = [['book_title', 'title'], ['author_name', 'author']]
    res_table, _ = insert_from_select(from_table, target_table, engine, col_mappings)
    records = get_records(res_table, engine)
    assert res_table.c['id'] == target_table.c[0]
    assert res_table.c['title'] == target_table.c[1]
    assert res_table.c['author'] == target_table.c[2]
    assert records == records_with_mappings
