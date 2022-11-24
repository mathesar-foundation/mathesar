import re


def test_exception_stacktrace(client):
    response = client.post('/api/ui/v0/users/')
    response_data = response.json()

    assert response.status_code == 403
    assert response_data[0]['code'] == 4004
    assert response_data[0]['message'] == 'CSRF Failed: CSRF token missing or incorrect.'
    assert response_data[0]['details']['exception'] == 'CSRF Failed: CSRF token missing or incorrect.'
    assert len(response_data[0]['stacktrace']) >= 1
    assert bool(re.match('\d.(.*)",(.*)line(.*)\d,(.*)in(.*)', response_data[0]['stacktrace'][0])) == True
