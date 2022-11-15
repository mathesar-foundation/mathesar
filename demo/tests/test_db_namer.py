from demo.db_namer import get_name


def test_db_namer_32char_sessionid_defaults():
    name = get_name('abcdefghijklmnop0123456789ABCDEF')
    assert name == 'cosy_mighty_special_mathesar'


def test_db_namer_0char_sessionid_defaults():
    name = get_name('')
    assert name == 'current_organic_mathesar'


def test_db_namer_none_sessionid_defaults():
    name = get_name(None)
    assert name == 'current_organic_mathesar'


def test_db_namer_9char_sessionid_defaults():
    name = get_name('abcdefghi')
    assert name == 'cosy_mighty_hideous_mathesar'
