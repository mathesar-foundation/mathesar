from unittest.mock import patch


def test_reflect_endpoint(client):
    with patch('mathesar.state.reset_reflection') as reflect_mock:
        response = client.post('/api/ui/v0/reflect/')
    assert response.status_code == 200
    reflect_mock.assert_called_once()
