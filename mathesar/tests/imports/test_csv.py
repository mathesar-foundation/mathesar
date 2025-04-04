import pytest

from mathesar.errors import InvalidTableError
from mathesar.utils.csv import get_sv_dialect


get_dialect_test_list = [
    (",", '"', "", "mathesar/tests/data/patents.csv"),
    ("\t", '"', "", "mathesar/tests/data/patents.tsv"),
    (",", "'", "", "mathesar/tests/data/csv_parsing/mixed_quote.csv"),
    (",", '"', "", "mathesar/tests/data/csv_parsing/double_quote.csv"),
    (",", '"', "\\", "mathesar/tests/data/csv_parsing/escaped_quote.csv"),
]


@pytest.mark.parametrize("exp_delim,exp_quote,exp_escape,file", get_dialect_test_list)
def test_sv_get_dialect(exp_delim, exp_quote, exp_escape, file):
    with open(file, "r") as sv_file:
        dialect = get_sv_dialect(sv_file)
    assert dialect.delimiter == exp_delim
    assert dialect.quotechar == exp_quote
    assert dialect.escapechar == exp_escape


get_dialect_exceptions_test_list = [
    "mathesar/tests/data/csv_parsing/patents_invalid.csv",
    "mathesar/tests/data/csv_parsing/extra_quote_invalid.csv",
    "mathesar/tests/data/csv_parsing/escaped_quote_invalid.csv",
]


@pytest.mark.parametrize("file", get_dialect_exceptions_test_list)
def test_sv_get_dialect_exceptions(file):
    with pytest.raises(InvalidTableError):
        with open(file, "r") as sv_file:
            get_sv_dialect(sv_file)
