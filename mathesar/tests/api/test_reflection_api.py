def test_reflect_endpoint(client):
    response = client.post('/api/ui/v0/reflect/')
    assert response.status_code == 200
