import pytest
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()
