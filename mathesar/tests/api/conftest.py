from django.core.files import File
import pytest

from mathesar.models.base import DataFile


@pytest.fixture
def create_data_file():
    def _create_data_file(file_path, file_name):
        with open(file_path, 'rb') as csv_file:
            data_file = DataFile.objects.create(
                file=File(csv_file), created_from='file',
                base_name=file_name, type='csv'
            )

        return data_file
    return _create_data_file
