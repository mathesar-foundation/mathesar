import re

from django.test import override_settings


@override_settings(MATHESAR_MODE='DEVELOPMENT')
def test_exception_stacktrace(client):
    response = client.post('/api/ui/v0/users/')
    response_data = response.json()
    assert response.status_code == 400
    assert response_data[0]['code'] == 2002
    assert len(response_data[0]['stacktrace']) >= 1
    assert bool(re.match('(.*)",(.*)line(.*),(.*)in(.*)', response_data[0]['stacktrace'][0])) is True
