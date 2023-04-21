import hashlib


POSTGRES_IDENTIFIER_SIZE_LIMIT = 63


def truncate_if_necessary(identifier):
    """
    Takes an identifier and returns it, truncating it, if it is too long. The truncated version
    will end with a hash of the passed identifier, therefore column name collision should be very
    rare.

    Iteratively removes characters from the end of the identifier, until the resulting string, with
    the suffix hash of the identifier appended, is short enough that it doesn't need to be truncated
    anymore. Whitespace is trimmed from the truncated identifier before appending the suffix.
    """
    assert type(identifier) is str
    if not is_identifier_too_long(identifier):
        return identifier
    right_side = "-" + _get_truncation_hash(identifier)
    identifier_length = len(identifier)
    assert len(right_side) < identifier_length  # Sanity check
    range_of_num_of_chars_to_remove = range(1, identifier_length)
    for num_of_chars_to_remove in range_of_num_of_chars_to_remove:
        left_side = identifier[:num_of_chars_to_remove * -1]
        left_side = left_side.rstrip()
        truncated_identifier = left_side + right_side
        if not is_identifier_too_long(truncated_identifier):
            return truncated_identifier
    raise Exception(
        "Acceptable truncation not found; should never happen."
    )


def is_identifier_too_long(identifier):
    # TODO we should support POSTGRES_IDENTIFIER_SIZE_LIMIT here;
    # Our current limit due to an unknown bug that manifests at least
    # when importing CSVs seems to be 57 bytes. Here we're setting it even
    # lower just in case.
    our_temporary_identifier_size_limit = 48
    size = _get_size_of_identifier_in_bytes(identifier)
    return size > our_temporary_identifier_size_limit


def _get_truncation_hash(identifier):
    """
    Produces an 8-character string hash of the passed identifier.

    Using hash function blake2s, because it seems fairly recommended and it seems to be better
    suited for shorter digests than blake2b. We want short digests to not take up too much of the
    truncated identifier in whose construction this will be used.
    """
    h = hashlib.blake2s(digest_size=4)
    bytes = _get_identifier_in_bytes(identifier)
    h.update(bytes)
    return h.hexdigest()


def _get_size_of_identifier_in_bytes(s):
    bytes = _get_identifier_in_bytes(s)
    return len(bytes)


def _get_identifier_in_bytes(s):
    """
    Afaict, following Postgres doc [0] says that UTF-8 supports all languages; therefore, different
    server locale configurations should not break this.

    [0] https://www.postgresql.org/docs/13/multibyte.html
    """
    return s.encode('utf-8')
