import os
import json
import sys

LANGUAGES_DIR = "./languages"
EN_DICT_PATH = os.path.join(LANGUAGES_DIR, "en/dict.json")

def load_json(filepath):
    """Load JSON from a given filepath."""
    try:
        print(f"Loading file: {filepath}")
        with open(filepath, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {filepath}: {e}")
        return {}

def find_missing_and_extra_keys(en_dict, other_dict):
    """Find missing and extra keys between the English dictionary and another dictionary."""
    missing_keys = [key for key in en_dict if key not in other_dict]
    extra_keys = [key for key in other_dict if key not in en_dict]
    return missing_keys, extra_keys

def main():
    # Load the English dictionary
    en_dict = load_json(EN_DICT_PATH)
    if not en_dict:
        print("English dictionary is empty or not found.")
        sys.exit(1)

    # Find all non-English language directories
    languages = [
        lang for lang in os.listdir(LANGUAGES_DIR)
        if os.path.isdir(os.path.join(LANGUAGES_DIR, lang)) and lang != "en"
    ]
    if not languages:
        print("No additional language directories found.")
        sys.exit(0)

    print(f"Found languages: {languages}\n")

    has_issues = False  # Track if any issues are found

    # Check for missing and extra keys in each language
    for lang in languages:
        lang_dict_path = os.path.join(LANGUAGES_DIR, lang, "dict.json")
        lang_dict = load_json(lang_dict_path)
        if not lang_dict:
            print(f"Skipping {lang}: dictionary is empty or not found.")
            continue

        missing_keys, extra_keys = find_missing_and_extra_keys(en_dict, lang_dict)

        print(f"Language: {lang}")
        if missing_keys:
            print(f"  Missing Keys ({len(missing_keys)}):")
            for key in missing_keys:
                print(f"    - {key}")
            has_issues = True
        else:
            print("  No missing keys!")

        if extra_keys:
            print(f"  Extra Keys ({len(extra_keys)}):")
            for key in extra_keys:
                print(f"    - {key}")
            has_issues = True
        else:
            print("  No extra keys!")

        print()  # Blank line for readability

    # Exit with error code if issues were found
    if has_issues:
        print("Translation issues found. Please fix the missing or extra keys.")
        sys.exit(1)
    else:
        print("All translations are consistent.")
        sys.exit(0)

if __name__ == "__main__":
    main()
