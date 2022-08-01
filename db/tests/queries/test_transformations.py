from db.transforms import base as transforms_base


def test_basic_transforms(engine, shallow_link_dbquery):
    dbq = shallow_link_dbquery
    transformations = [
        transforms_base.Offset(1),
        transforms_base.Limit(1),
    ]
    dbq.transformations = transformations
    records = dbq.get_records(engine=engine)
    assert records == [(2, 'uni1')]
