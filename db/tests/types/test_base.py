import pytest

from sqlalchemy import select

from db.functions.base import ArrayAgg
from db.tables.operations.select import reflect_table
from db.transforms.base import Summarize


@pytest.fixture
def up_to_date_uris_table_obj(uris_table_obj):
    uris_table, engine = uris_table_obj
    # Apparently we need to reflect to have up-to-date column type
    uris_table = reflect_table(
        name=uris_table.name,
        schema=uris_table.schema,
        engine=engine,
        metadata=uris_table.metadata
    )
    return uris_table, engine


@pytest.mark.skip(reason="produces weird breakage")
def test_custom_type_aggregation(up_to_date_uris_table_obj):
    """
    Our custom types can break during array_agg (ArrayAgg) with output looking something like:

    `['{', 'h', 't', 't', 'p', ':', '/', '/', 's', 'o', ...]`

    This is meant to test that that doesn't happen.
    """
    uris_table, engine = up_to_date_uris_table_obj
    uri_col = uris_table.c.uri
    uri_col_name = uri_col.name
    id_col = uris_table.c.id
    id_col_name = id_col.name
    spec = dict(
        base_grouping_column=id_col_name,
        grouping_expressions=[
            dict(
                input_alias=id_col_name,
                output_alias=id_col_name + "grouped",
                preproc=None,
            ),
        ],
        aggregation_expressions=[
            dict(
                input_alias=uri_col_name,
                output_alias=uri_col_name + "agged",
                function=ArrayAgg.id,
            )
        ]
    )
    summarize_transform = Summarize(spec=spec)
    non_executable = summarize_transform.apply_to_relation(uris_table)
    executable = select(non_executable)
    records = list(engine.connect().execute(executable))
    result_uris = set(record[1][0] for record in records)
    expected_records = [
        (11, ['http://tweetphoto.com/31332311']),
        (8, ['http://soundcloud.com/dj-soro']),
        (19, ['ftps://asldp.com/158915']),
        (4, ['http://imgur.com/M2v2H.png']),
        (14, ['http://yfrog.com/msradon2p']),
        (3, ['http://banedon.posterous.com/bauforstschritt-2262010']),
        (17, ['http://tumblr.com/x4acyiuxf']),
        (20, ['ftp://abcdefg.com/x-y-z']),
        (13, ['http://yfrog.com/j6cimg3038gj']),
        (10, ['http://www.flickr.com/photos/jocke66/4657443374/']),
        (9, ['http://i.imgur.com/H6yyu.jpg']),
        (7, ['http://tweetphoto.com/31103212']),
        (1, ['http://soundcloud.com/denzo-1/denzo-in-mix-0knackpunkt-nr-15-0-electro-swing']),
        (5, ['http://tweetphoto.com/31300678']),
        (18, ['ftp://foobar.com/179179']),
        (2, ['http://picasaweb.google.com/lh/photo/94RGMDCSTmCW04l6SPnteTBPFtERcSvqpRI6vP3N6YI?feat=embedwebsite']),
        (16, ['http://soundcloud.com/strawberryhaze/this-is-my-house-in-summer-2010']),
        (15, ['http://soundcloud.com/hedo/hedo-der-groove-junger-knospen']),
        (6, ['http://www.youtube.com/watch?v=zXLGHyGxY2E']),
        (12, ['http://tweetphoto.com/31421017'])
    ]
    expected_uris = set(expected_record[1][0] for expected_record in expected_records)
    assert result_uris == expected_uris
