"""Utility function for generating database names from session ID cookies."""
WORDS = [
    'wax', 'wry', 'jet', 'end', 'web', 'elf', 'jam', 'key', 'ant', 'fin', 'top',
    'ray', 'tan', 'box', 'saw', 'tie', 'spy', 'day', 'gym', 'fox', 'van', 'ear',
    'hub', 'age', 'hot', 'pin', 'red', 'map', 'run', 'den', 'bay', 'gas', 'nut',
    'toy', 'art', 'net', 'pea', 'yam', 'pet', 'hat', 'ivy', 'egg', 'log', 'mum',
    'rat', 'owl', 'hen', 'dry', 'bar', 'cub', 'dew', 'sun', 'lip', 'pig', 'tin',
    'mud', 'ox', 'wok', 'ink', 'ton', 'big', 'way', 'tax', 'amp', 'act', 'ice',
    'far', 'low', 'air', 'cut', 'oak', 'yak', 'eel', 'gem', 'few', 'ski', 'law',
    'sea', 'hip', 'bag', 'bug', 'shy', 'dot', 'dye', 'eye', 'jaw', 'rib', 'mat',
    'fir', 'bit', 'son', 'cat', 'six', 'fly', 'car', 'tub', 'emu', 'elk', 'tv',
    'sly', 'tip', 'fan', 'fur', 'yew', 'jay', 'bus', 'zoo', 'sky', 'elm', 'cry',
    'bee', 'tar', 'awe', 'bat', 'kip', 'cod', 'oil', 'foe', 'pot', 'ash', 'gum',
    'odd', 'icy', 'koi', 'bun', 'era', 'leo', 'lan', 'soy', 'paw', 'can', 'pan',
    'jar', 'pen', 'may', 'tea', 'ten', 'asp', 'dog', 'cap', 'bed', 'fog', 'bow',
    'cup', 'pie', 'cow', 'fig', 'boa'
]

MODULUS = len(WORDS)


def get_name(
        session_id,
        chunk=2,
        max_words=5,
        join_val='_',
        word_list=None,
        modulus=None,
):
    """
    Deterministically generate a name of the form word1_word2_word3_....

    This is designed to work with Django sessionid cookie values, but
    would theoretically work with any string value.

    Given `session_id`, we convert it to hex, then get a sequence of
    numbers by breaking the resulting value into hex strings of length
    `chunk`, then converting each to a decimal integer modulo `modulus`.
    Finally, we find an adjective corresponding to each integer by its
    index in the given `adjectives` list, and join them with a terminal
    string 'mathesar' using the given `join_val`.
    """
    hex_chunk = 2 * chunk
    bytes_length = chunk * max_words
    session_id = session_id or ''
    modulus = modulus or MODULUS
    word_list = word_list or WORDS
    salt_gen = 'A'  # generates 'paw_paw_paw_...' after transformation
    session_id += salt_gen * (bytes_length - len(session_id))
    session_hex = bytes(session_id, 'utf-8').hex()
    indices = (
        int(session_hex[i:i + hex_chunk], 16) % modulus
        for i in range(0, 2 * bytes_length, hex_chunk)
    )
    return join_val.join(word_list[i] for i in indices)
