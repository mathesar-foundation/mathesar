from mathesar.models import Table


def test_record_list(create_table, client):
    """
    Desired format:
    {
        "count": 25,
        "results": [
            {
                "mathesar_id": 1,
                "X": "11857059.254",
                "Y": "7028020.162",
                "OBJECTID": "1",
                "DESCRIPTION": "DOLLEY MADISON LIBRARY",
                "JURISDICTION": "COUNTY OF FAIRFAX",
                "WEB_ADDRESS": "https://www.fairfaxcounty.gov/library/branches/dolley-madison",
                "STREET_NUMBER": "1244",
                "STREET_NAME": "OAK RIDGE AVE",
                "CITY": "MCLEAN",
                "ZIP": "22101",
                "CreationDate": "2021/03/06 06:03:20.044+00",
                "Creator": "FairfaxCounty",
                "EditDate": "2021/03/06 06:03:20.044+00",
                "Editor": "FairfaxCounty"
            },
            {
                "mathesar_id": 2,
                "X": "11851064.546",
                "Y": "7015915.406",
                "OBJECTID": "2",
                "DESCRIPTION": "TYSONS-PIMMIT REGIONAL LIBRARY",
                "JURISDICTION": "COUNTY OF FAIRFAX",
                "WEB_ADDRESS": "https://www.fairfaxcounty.gov/library/branches/tysons-pimmit-regional",
                "STREET_NUMBER": "7584",
                "STREET_NAME": "LEESBURG PIKE",
                "CITY": "FALLS CHURCH",
                "ZIP": "22043",
                "CreationDate": "2021/03/06 06:03:20.044+00",
                "Creator": "FairfaxCounty",
                "EditDate": "2021/03/06 06:03:20.044+00",
                "Editor": "FairfaxCounty"
            },
            etc.
        ]
    }
    """
    table_name = 'Fairfax County Record List'
    create_table(table_name)
    table = Table.objects.get(name=table_name)

    response = client.get(f'/api/v0/tables/{table.id}/records/')
    response_data = response.json()
    record_data = response_data['results'][0]

    assert response.status_code == 200
    assert response_data['count'] == 25
    assert len(response_data['results']) == 25
    for column_name in table.sa_column_names:
        assert column_name in record_data
