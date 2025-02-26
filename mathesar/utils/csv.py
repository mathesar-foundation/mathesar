import clevercsv as csv

from mathesar.errors import InvalidTableError
# The user-facing documentation replicates these delimiter characters. If you
# c, process_column_nameshange this variable, please update the documentation as well.
ALLOWED_DELIMITERS = ",\t:|;"
SAMPLE_SIZE = 1000000
CHECK_ROWS = 10


def is_valid_csv(data):
    try:
        csv.reader(data)
    except (csv.CsvError, ValueError):
        return False
    return True


def get_file_encoding(file):
    """
    Given a file, uses charset_normalizer if installed or chardet which is
    installed as part of clevercsv module to detect the file encoding. Returns a
    default value of utf-8-sig if encoding could not be detected or detection
    libraries are missing.
    """
    from charset_normalizer import detect
    # Sample Size reduces the accuracy
    encoding = detect(file.read()).get('encoding', None)
    file.seek(0)
    if encoding is not None:
        return encoding
    return "utf-8"


def get_sv_dialect(file):
    """
    Given a *sv file, generate a dialect to parse it.

    Args:
        file: _io.TextIOWrapper object, an already opened file

    Returns:
        dialect: csv.Dialect object, the dialect to parse the file

    Raises:
        InvalidTableError: If the generated dialect was unable to parse the file
    """
    dialect = csv.detect.Detector().detect(file.read(SAMPLE_SIZE),
                                           delimiters=ALLOWED_DELIMITERS)
    if dialect is None:
        raise InvalidTableError

    file.seek(0)
    if _check_dialect(file, dialect):
        file.seek(0)
        return dialect
    else:
        raise InvalidTableError


def _check_dialect(file, dialect):
    """
    Checks to see if we can parse the given file with the given dialect

    Parses the first CHECK_ROWS rows. Checks to see if any have formatting issues (as
    indicated by parse_row), or if any have a differing number of columns.

    Args:
        file: _io.TextIOWrapper object, an already opened file
        dialect: csv.Dialect object, the dialect we are validating

    Returns:
        bool: False if any error that would cause SQL errors were found, otherwise True
    """
    prev_num_columns = None
    row_gen = csv.read.reader(file, dialect)
    for _ in range(CHECK_ROWS):
        try:
            row = next(row_gen)
        except StopIteration:
            # If less than CHECK_ROWS rows in file, stop early
            break

        num_columns = len(row)
        if prev_num_columns is None:
            prev_num_columns = num_columns
        elif prev_num_columns != num_columns:
            return False
    return True
