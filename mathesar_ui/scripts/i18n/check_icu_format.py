#!/usr/bin/env python3

import json
import re
from pathlib import Path

MATHESAR_UI_DIR = Path(__file__).resolve().parent.parent.parent
EN_DICT_FILE = MATHESAR_UI_DIR / 'src/i18n/languages/en/dict.json'


def check_balanced_braces(text, key):
    """Check if curly braces are balanced."""
    count = 0
    for char in text:
        if char == '{':
            count += 1
        elif char == '}':
            count -= 1
        if count < 0:
            return f"Unmatched closing brace in '{key}'"
    if count != 0:
        return f"Unmatched opening brace in '{key}'"
    return None


def check_plural_syntax(text, key):
    """Validate ICU plural syntax."""
    plural_pattern = r'\{(\w+),\s*plural,\s*([^}]+)\}'
    
    for match in re.finditer(plural_pattern, text):
        cases_text = match.group(2)
        
        if 'other' not in cases_text:
            return f"Plural in '{key}' missing required 'other' case"
        
        valid_cases = r'\b(zero|one|two|few|many|other|=\d+)\s*\{'
        if not re.search(valid_cases, cases_text):
            return f"Invalid plural syntax in '{key}'"
    
    return None


def main():
    with open(EN_DICT_FILE, 'r') as f:
        dictionary = json.load(f)
    
    errors = []
    
    for key, value in dictionary.items():
        if not isinstance(value, str):
            continue
        
        error = check_balanced_braces(value, key)
        if error:
            errors.append(error)
            continue
        
        error = check_plural_syntax(value, key)
        if error:
            errors.append(error)
    
    if errors:
        print("ERROR: ICU format validation failed:")
        for error in errors:
            print(f"  - {error}")
        print(f"\nTotal: {len(errors)}")
        exit(1)
    else:
        print("✓ All translations have valid ICU format")
        exit(0)


if __name__ == "__main__":
    main()
