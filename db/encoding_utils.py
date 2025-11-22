import codecs

# TODO: Add closest compatible encoding for the missing encodings.
#  See https://github.com/centerofci/mathesar/pull/688#issuecomment-952168393 for more details
_SQL_COMPATIBLE_ENCODINGS_MAP = {
    'iso8859-15': ('iso8859-15', 'LATIN9'),
    'cp1253': ('cp1253', 'WIN1253'),
    'iso8859-16': ('iso8859-16', 'LATIN10'),
    'iso8859-4': ('iso8859-4', 'LATIN4'),
    'gbk': ('gbk', 'GBK'),
    'cp1250': ('cp1250', 'WIN1250'),
    'gb18030': ('gb18030', 'GB18030'),
    'cp949': ('cp949', 'UHC'),
    'iso8859-14': ('iso8859-14', 'LATIN8'),
    'cp1251': ('cp1251', 'WIN1251'),
    'shift_jis_2004': ('shift_jis_2004', 'SHIFT_JIS_2004'),
    'gb2312': ('gb2312', 'EUC_CN'),
    'cp1255': ('cp1255', 'WIN1255'),
    'johab': ('johab', 'JOHAB'),
    'cp1257': ('cp1257', 'WIN1257'),
    'iso8859-5': ('iso8859-5', 'ISO_8859_5'),
    'euc_jis_2004': ('euc_jis_2004', 'EUC_JIS_2004'),
    'iso8859-13': ('iso8859-13', 'LATIN7'),
    'utf-8': ('utf-8', 'UTF8'),
    'big5': ('big5', 'BIG5'),
    'iso8859-2': ('iso8859-2', 'LATIN2'),
    'iso8859-3': ('iso8859-3', 'LATIN3'),
    'cp1256': ('cp1256', 'WIN1256'),
    'iso8859-7': ('iso8859-7', 'ISO_8859_7'),
    'shift_jis': ('shift_jis', 'SJIS'),
    'cp866': ('cp866', 'WIN866'),
    'cp1254': ('cp1254', 'WIN1254'),
    'cp874': ('cp874', 'WIN874'),
    'iso8859-6': ('iso8859-6', 'ISO_8859_6'),
    'iso8859-1': ('iso8859-1', 'LATIN1'),
    'cp1258': ('cp1258', 'WIN1258'),
    'iso8859-9': ('iso8859-9', 'LATIN5'),
    'iso8859-8': ('iso8859-8', 'ISO_8859_8'),
    'euc_jp': ('euc_jp', 'EUC_JP'),
    'euc_kr': ('euc_kr', 'EUC_KR'),
    'cp1252': ('cp1252', 'WIN1252'),
    'iso8859-10': ('iso8859-10', 'LATIN6'),
    'utf-32-be': ('utf-8', 'utf-8'),
    'utf-8-sig': ('utf-8', 'utf-8'),
    'utf-16-be': ('utf-8', 'utf-8'),
    'utf-32': ('utf-8', 'utf-8'),
    'utf-32-le': ('utf-8', 'utf-8'),
    'utf-16-le': ('utf-8', 'utf-8'),
    'ascii': ('utf-8', 'utf-8'),
    'utf-16': ('utf-8', 'utf-8'),
    'utf-7': ('utf-8', 'utf-8')
}


def get_sql_compatible_encoding(encoding):
    """

    Args:
        encoding: Name of the encoding

    Returns: tuple containing the normalized encoding name the file has to be converted into
    and the postgres name of the conversion encoding name

    """
    # Converts alias, separators to proper IANA name
    normalized_encoding = codecs.lookup(encoding).name
    return _SQL_COMPATIBLE_ENCODINGS_MAP.get(normalized_encoding, ("utf-8", "utf-8"))
