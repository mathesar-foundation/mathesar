import pytest
from django.core.files.base import ContentFile

from db.constants import COLUMN_NAME_TEMPLATE
import mathesar.imports.datafile as datafile_module
from mathesar.imports.datafile import copy_datafile_to_table
from mathesar.models.base import DataFile


# Uses \r\n line endings and an empty field to exercise newline="" handling and
# the empty-string -> None conversion.
CSV_CONTENT = "a,b,c\r\n1,2,3\r\n,5,6\r\n"


@pytest.fixture
def captured_import(monkeypatch):
    """Capture what copy_datafile_to_table feeds to the import, without a DB."""
    captured = {}

    def fake_import(
        processed_rows, table_name, schema_oid, column_names, conn,
        comment=None, import_into_temp_table=False
    ):
        captured['column_names'] = column_names
        # processed_rows is a lazy generator over the still-open file; materialize
        # it here before the storage file is closed.
        captured['rows'] = [list(row) for row in processed_rows]
        return {'table_oid': 123, 'table_name': table_name}

    monkeypatch.setattr(datafile_module, 'create_and_import_from_rows', fake_import)
    return captured


def _make_datafile(user, header):
    return DataFile.objects.create(
        file=ContentFile(CSV_CONTENT.encode('utf-8'), name='sample.csv'),
        type='csv',
        created_from='file',
        base_name='sample',
        header=header,
        user=user,
    )


def test_copy_datafile_with_header(user_alice, captured_import):
    data_file = _make_datafile(user_alice, header=True)

    result = copy_datafile_to_table(user_alice, data_file.id, None, schema_oid=1, conn=None)

    assert captured_import['column_names'] == ['a', 'b', 'c']
    assert captured_import['rows'] == [['1', '2', '3'], [None, '5', '6']]
    assert result['oid'] == 123


def test_copy_datafile_without_header_keeps_first_row(user_alice, captured_import):
    data_file = _make_datafile(user_alice, header=False)

    copy_datafile_to_table(user_alice, data_file.id, None, schema_oid=1, conn=None)

    assert captured_import['column_names'] == [
        f'{COLUMN_NAME_TEMPLATE}0',
        f'{COLUMN_NAME_TEMPLATE}1',
        f'{COLUMN_NAME_TEMPLATE}2',
    ]
    assert captured_import['rows'] == [
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        [None, '5', '6'],
    ]
