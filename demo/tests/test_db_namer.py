from demo.db_namer import get_name


def test_db_namer_32char_sessionid_defaults():
    name = get_name('abcdefghijklmnop0123456789ABCDEF')
    assert name == 'far_ten_ink_soy_dew'


def test_db_namer_0char_sessionid_defaults():
    name = get_name('')
    assert name == 'paw_paw_paw_paw_paw'


def test_db_namer_none_sessionid_defaults():
    name = get_name(None)
    assert name == 'paw_paw_paw_paw_paw'


def test_db_namer_a_sessionid_defaults():
    name = get_name('a')
    assert name == 'toy_paw_paw_paw_paw'


def test_db_namer_0_sessionid_defaults():
    name = get_name('0')
    assert name == 'cut_paw_paw_paw_paw'


def test_db_namer_9char_sessionid_defaults():
    name = get_name('abcdefghi')
    assert name == 'far_ten_ink_soy_fin'
