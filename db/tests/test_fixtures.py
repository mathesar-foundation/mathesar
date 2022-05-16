from db.types.base import MathesarCustomType


def test_engines_having_separate_ischema_names(engine_without_ischema_names_updated, engine):
    """
    We want to have fixtures for engines with different ischema_names. Here we test that that's
    possible. A peculiarity in SA causes different instances of Engine to refer to the same
    ischema_names dict. Here we test that that's successfully monkey-patched.
    """
    ischema_names1 = engine_without_ischema_names_updated.dialect.ischema_names
    ischema_names2 = engine.dialect.ischema_names

    x = "x"
    assert x not in ischema_names1
    assert x not in ischema_names2
    ischema_names1[x] = 1
    assert x in ischema_names1
    assert x not in ischema_names2
    del ischema_names1[x]

    y = "y"
    assert y not in ischema_names1
    assert y not in ischema_names2
    ischema_names2[y] = 2
    assert y not in ischema_names1
    assert y in ischema_names2
    del ischema_names2[y]


def test_engines_having_appropriate_ischema_names(engine_without_ischema_names_updated, engine):
    """
    We want to have fixtures for engines with and without updated ischema_names. Here we test that
    it is so.
    """
    for ma_type in MathesarCustomType:
        assert ma_type.id not in engine_without_ischema_names_updated.dialect.ischema_names
        assert ma_type.id in engine.dialect.ischema_names
