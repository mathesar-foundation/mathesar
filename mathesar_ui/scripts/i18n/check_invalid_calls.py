#!/usr/bin/env python3

import os
import subprocess
from pathlib import Path

MATHESAR_UI_DIR = Path(__file__).resolve().parent.parent.parent

EN_DICT_FILE = os.path.join(MATHESAR_UI_DIR, 'src/i18n/languages/en/dict.json')


# Returns True during these cases:
#   - Direct: `$_(variable)`
#   - Considers spaces: `$_(  variable, { values: { date: dateString } })`
#   - Considers multiple lines. Eg.,
#       ```
#       $_(
#            variable,
#       )
#       ```
def has_invalid_calls():
    try:
        pattern = r"\$\_\(\s*[^'\''[:space:]]|get\(_\)\(\s*[^'\''[:space:]]"
        subprocess.run(
            [
                'grep',
                '-lrEz',
                pattern,
                '--include=**.svelte',
                '--include=**.ts',
                r'--exclude=\*i18n\*',
                os.path.join(MATHESAR_UI_DIR, 'src')
            ],
            check=True
        )
        return True
    except subprocess.CalledProcessError:
        return False
    except Exception:
        raise


def main():
    if has_invalid_calls():
        print("i18n strings should not be passed as variables")
        exit(1)
    else:
        print("All OK")
        exit(0)


if __name__ == "__main__":
    main()
