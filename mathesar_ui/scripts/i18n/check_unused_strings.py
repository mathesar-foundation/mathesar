#!/usr/bin/env python3

import re
import os
import subprocess
from pathlib import Path
import json
from check_invalid_calls import has_invalid_calls


if has_invalid_calls():
    print("There are invalid i18n invocations. Please fix them before checking for unused strings")
    exit(1)


MATHESAR_UI_DIR = Path(__file__).resolve().parent.parent.parent

EN_DICT_FILE = os.path.join(MATHESAR_UI_DIR, 'src/i18n/languages/en/dict.json')


# Checks for usage of `$_('string'` or `get(_)('string'`.
# Scenarios handled:
#   - Direct usage: eg., `$_('string')`
#   - Usage with args: eg., `$_('string', { values: { date: dateString } })`
#   - Considers multiple lines. Eg.,
#       ```
#       $_(
#            'string',
#       )
#       ```
def grep_i18n_string(string):
    try:
        escaped_string = re.escape(string)
        pattern = rf"\$_\(\s*'{escaped_string}'|get\(_\)\(\s*'{escaped_string}'"
        subprocess.run(
            [
                'grep',
                '-qrEz',
                pattern,
                '--include=**.svelte',
                '--include=**.ts',
                r'--exclude=\*i18n\*',
                os.path.join(MATHESAR_UI_DIR, 'src')
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return True
    except subprocess.CalledProcessError:
        return False
    except Exception:
        raise


with open(EN_DICT_FILE, 'r') as en_dict_file:
    en_dict_json = json.load(en_dict_file)
    not_found_count = 0
    for key in en_dict_json:
        if not grep_i18n_string(key):
            print("UNUSED: " + key)
            not_found_count += 1
    print("Number of unused strings: " + str(not_found_count))
