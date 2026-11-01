#!/usr/bin/env python3

import json
import re
import subprocess
from pathlib import Path

MATHESAR_UI_DIR = Path(__file__).resolve().parent.parent.parent
EN_DICT_FILE = MATHESAR_UI_DIR / 'src/i18n/languages/en/dict.json'
SRC_DIR = MATHESAR_UI_DIR / 'src'


def extract_variables_from_icu(text):
    """Extract variable names from ICU MessageFormat text."""
    variables = set()

    # Simple variables: {varName}
    for match in re.finditer(r'\{([a-zA-Z_]\w*)\}', text):
        variables.add(match.group(1))

    # Plural variables: {varName, plural, ...}
    for match in re.finditer(r'\{(\w+),\s*plural,', text):
        variables.add(match.group(1))

    # Select variables: {varName, select, ...}
    for match in re.finditer(r'\{(\w+),\s*select,', text):
        variables.add(match.group(1))

    return variables


def find_translation_calls():
    """Find all translation function calls and their arguments."""
    calls = []

    # Find all .svelte and .ts files
    result = subprocess.run(
        [
            'find', str(SRC_DIR), '-type', 'f', '(',
            '-name', '*.svelte', '-o', '-name', '*.ts', ')'
        ],
        capture_output=True,
        text=True,
        shell=False
    )

    if result.returncode != 0:
        return calls

    files = [
        f for f in result.stdout.strip().split('\n')
        if f and 'i18n' not in f
    ]

    for filepath in files:
        try:
            with open(filepath, 'r') as f:
                content = f.read()

            # Match $_('key', { values: { var1: ..., var2: ... } })
            pattern = (
                r"\$_\s*\(\s*'([^']+)'\s*"
                r"(?:,\s*\{[^}]*values\s*:\s*\{([^}]*)\})?[^)]*\)"
            )

            for match in re.finditer(
                pattern, content, re.MULTILINE | re.DOTALL
            ):
                key = match.group(1)
                values_str = match.group(2) if match.group(2) else ''

                # Extract variable names from values object
                provided_vars = set()
                if values_str:
                    for var_match in re.finditer(r'(\w+)\s*:', values_str):
                        provided_vars.add(var_match.group(1))

                calls.append({
                    'file': filepath,
                    'key': key,
                    'provided': provided_vars
                })
        except Exception:
            continue

    return calls


def main():
    with open(EN_DICT_FILE, 'r') as f:
        dictionary = json.load(f)

    calls = find_translation_calls()
    errors = []

    for call in calls:
        key = call['key']
        if key not in dictionary:
            continue  # Handled by check_missing_strings.py

        required_vars = extract_variables_from_icu(dictionary[key])
        provided_vars = call['provided']

        missing = required_vars - provided_vars
        if missing:
            errors.append(
                f"{call['file']}: Key '{key}' requires variables "
                f"{sorted(missing)} but they are not provided"
            )

    if errors:
        print("ERROR: Translation calls missing required variables:")
        for error in errors:
            print(f"  - {error}")
        print(f"\nTotal errors: {len(errors)}")
        exit(1)
    else:
        print("✓ All translation calls provide required variables")
        exit(0)


if __name__ == "__main__":
    main()
