"""Utility function for generating database names from session ID cookies."""

ADJECTIVES = [
    'amusing', 'ancient', 'antique', 'asian', 'austere', 'average', 'awesome',
    'beloved', 'best', 'better', 'big', 'bigger', 'biggest', 'bizarre', 'black',
    'bland', 'boring', 'breezy', 'bright', 'broken', 'busiest', 'busy',
    'central', 'certain', 'changed', 'cheap', 'cheaper', 'cheery', 'chilly',
    'classic', 'clean', 'cleaner', 'clear', 'clearer', 'closer', 'closest',
    'closing', 'cloudy', 'coastal', 'cold', 'coldest', 'comfy', 'common',
    'complex', 'cool', 'coolest', 'cosy', 'cozy', 'crowded', 'current', 'damp',
    'dark', 'darker', 'darkest', 'desired', 'dim', 'dingy', 'dirty', 'double',
    'drab', 'driest', 'dry', 'dual', 'dull', 'duller', 'dullest', 'dusty',
    'early', 'elegant', 'empty', 'exotic', 'famous', 'fancy', 'filmed',
    'filthy', 'fine', 'foggy', 'foreign', 'formal', 'frosty', 'frozen', 'full',
    'funny', 'fuzzy', 'gaudy', 'ghastly', 'ghostly', 'glassy', 'glazed',
    'gloomy', 'glossy', 'godlike', 'good', 'grand', 'gray', 'great', 'green',
    'greener', 'grey', 'grisly', 'handy', 'happy', 'harsh', 'healthy', 'heavy',
    'hideous', 'hiding', 'high', 'holiest', 'home', 'hostile', 'hot', 'huge',
    'humid', 'idyllic', 'illegal', 'immense', 'indoor', 'initial', 'joint',
    'joyful', 'key', 'known', 'large', 'largest', 'lesser', 'light', 'limited',
    'little', 'lively', 'living', 'local', 'lofty', 'logical', 'lone', 'long',
    'lost', 'lousy', 'lovely', 'low', 'lower', 'lucky', 'luxury', 'magical',
    'main', 'major', 'marine', 'massive', 'maximum', 'mean', 'messy', 'middle',
    'mighty', 'minor', 'missing', 'misty', 'mixed', 'modern', 'moist', 'mouldy',
    'moving', 'muddy', 'mundane', 'murky', 'musty', 'muted', 'mystic', 'mythic',
    'naff', 'named', 'narrow', 'native', 'natural', 'nearby', 'neat', 'new',
    'nice', 'noisy', 'normal', 'notable', 'odd', 'odorous', 'old', 'only',
    'open', 'orderly', 'organic', 'outdoor', 'outside', 'paid', 'painful',
    'painted', 'perfect', 'petty', 'pitiful', 'placid', 'plain', 'planted',
    'poor', 'popular', 'precise', 'present', 'pretty', 'pricey', 'primal',
    'prior', 'private', 'proven', 'public', 'pure', 'queer', 'quiet', 'rainy',
    'rare', 'real', 'rebuilt', 'recent', 'red', 'refused', 'regular', 'related',
    'remote', 'rented', 'restful', 'retail', 'rich', 'right', 'rigid', 'rocky',
    'rural', 'sacred', 'sad', 'safe', 'scary', 'scenic', 'secret', 'secured',
    'senior', 'serious', 'sexy', 'shiny', 'shoddy', 'silent', 'silly',
    'similar', 'simple', 'single', 'sizable', 'slack', 'small', 'smelly',
    'smoking', 'snowy', 'soft', 'solid', 'sombre', 'spare', 'spatial',
    'special', 'stable', 'static', 'steady', 'strange', 'stupid', 'stylish',
    'sunny', 'super', 'superb', 'teenage', 'tidier', 'tight', 'tiny', 'tough',
    'tragic', 'uneven', 'unhappy', 'unknown', 'unsafe', 'unusual', 'urban',
    'vague', 'varied', 'various', 'very', 'vibrant', 'virtual', 'visual',
    'vital', 'vivid', 'vulgar', 'wacky', 'waiting', 'warm', 'wealthy',
    'weeping', 'weird', 'wet', 'white', 'whole', 'wicked', 'wide', 'wild',
    'windy', 'wooded', 'working', 'worldly', 'worst', 'worthy', 'wrong',
    'young', 'yucky'
]

MODULUS = len(ADJECTIVES)


def get_name(
        session_id,
        chunk=8,
        max_words=3,
        join_val='_',
        adjectives=None,
        modulus=None
):
    """
    Deterministically generate a name of the form adj1_adj2_adj3_mathesar.

    This is designed to work with Django sessionid cookie values, but
    would theoretically work with any string value.

    Given `session_id`, we convert it to hex, then get a sequence of
    numbers by breaking the resulting value into hex strings of length
    `chunk`, then converting each to a decimal integer modulo `modulus`.
    Finally, we find an adjective corresponding to each integer by its
    index in the given `adjectives` list, and join them with a terminal
    string 'mathesar' using the given `join_val`.
    """
    session_id = session_id or 'DEFAULT'
    adjectives = adjectives or ADJECTIVES
    modulus = modulus or MODULUS
    session_hex = bytes(session_id, 'utf-8').hex()
    upper_limit = min(len(session_hex), chunk * max_words)
    indices = (
        int(session_hex[i:i + chunk], 16) % modulus
        for i in range(0, upper_limit, chunk)
    )

    def get_word():
        for i in indices:
            yield adjectives[i]
        yield 'mathesar'

    return join_val.join(get_word())
