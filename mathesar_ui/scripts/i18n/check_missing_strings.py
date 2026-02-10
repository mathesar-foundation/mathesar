#!/usr/bin/env python3

import json
import os
import re
import subprocess
from pathlib import Path

MATHESAR_UI_DIR = Path(__file__).resolve().parent.parent.parent
EN_DICT_FILE = os.path.join(
    MATHESAR_UI_DIR, 'src/i18n/languages/en/dict.json'
)


def find_all_used_keys():
    """Find all translation keys used in the codebase."""
    keys = set()
    pattern = r"(?:\$_|get\(_\))\(\s*'([^']+)'"
    
    try:
        result = subprocess.run(
            [
                'grep',
                '-rhoE',
                pattern,
                '--include=*.svelte',
                '--include=*.ts',
                r'--exclude=*i18n*',
                os.path.join(MATHESAR_UI_DIR, 'src')
            ],
            capture_output=True,
            text=True,
            check=False
        )
        
        for line in result.stdout.split('\n'):
            if line:
                match = re.search(pattern, line)
                if match:
                    keys.add(match.group(1))
    except Exception as e:
        print(f"Error: {e}")
    
    return keys


def main():
    with open(EN_DICT_FILE, 'r') as f:
        dict_keys = set(json.load(f).keys())
    
    used_keys = find_all_used_keys()
    missing = used_keys - dict_keys
    
    if missing:
        print("ERROR: Translation keys used but not in dict.json:")
        for key in sorted(missing):
            print(f"  - {key}")
        print(f"\nTotal: {len(missing)}")
        exit(1)
    else:
        print("✓ All used translation keys exist in dict.json")
        exit(0)


if __name__ == "__main__":
    main()
