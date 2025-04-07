"""
This script performs the steps necessary for finalizing a Mathesar installation
"""
import os
import sys
import secrets
import string


ENV_FILE = ".env"

# Env variables that need to be prompted from the user
POSTGRES_KEYS = [
    {
        "key": "POSTGRES_HOST",
        "name": "Postgres database server host",
        "required": True
    },
    {
        "key": "POSTGRES_PORT",
        "name": "Postgres database server port",
        "required": False,
        "additional_validation": [
            {
                "validate": lambda value: value.isdigit() if value else True,
                "errmsg": "Postgres database server port should be numeric"
            }
        ]
    },
    {
        "key": "POSTGRES_DB",
        "name": "Postgres database name",
        "required": True
    },
    {
        "key": "POSTGRES_USER",
        "name": "Postgres username",
        "required": True
    },
    {
        "key": "POSTGRES_PASSWORD",
        "name": "Postgres password",
        "required": False
    }
]


def generate_secret_key(length=50):
    """Generate a random secret key of the specified length for Django."""
    allowed_chars = string.ascii_letters + string.digits + "!@#$%^&*(-_=+)"
    return ''.join(secrets.choice(allowed_chars) for _ in range(length))


def prompt_value(key_def):
    """
    Prompt the user for a value for the given key definition.
    Uses additional_validation (if provided) to check the value.
    """
    display_name = key_def["name"]
    required = key_def.get("required", False)
    additional_validation = key_def.get("additional_validation")

    while True:
        prompt_str = f"\nEnter {display_name}"
        prompt_str += " (required): " if required else " (optional, press Enter to skip): "
        value = input(prompt_str).strip()

        if not value:
            if required:
                print(f"Invalid: {display_name} cannot be empty.")
                continue
            else:
                return value

        if additional_validation:
            for rule in additional_validation:
                if not rule["validate"](value):
                    print(f"Invalid: {rule['errmsg']}")
                    break
            else:
                return value
        else:
            return value


def check_env_file(filepath=ENV_FILE):
    """Ensure that the .env file exists and is writable."""
    if not os.path.isfile(filepath):
        sys.exit(f"Error: {filepath} file not found")
    if not os.access(filepath, os.W_OK):
        sys.exit(f"Error: No write permission for {filepath}")


def read_env_file(filepath=ENV_FILE):
    """Read the .env file and return its lines and a dictionary of parsed variables."""
    try:
        with open(filepath, 'r') as f:
            lines = f.readlines()
    except Exception as e:
        sys.exit(f"Error reading {filepath}: {e}")

    env_vars = {}
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        if '=' in stripped:
            key, value = stripped.split('=', 1)
            env_vars[key.strip()] = value.strip()
    return lines, env_vars


def write_env_file(lines, filepath=ENV_FILE):
    """Write the updated lines back to the .env file."""
    try:
        with open(filepath, 'w') as f:
            f.writelines(lines)
    except Exception as e:
        sys.exit(f"Error writing to {filepath}: {e}")


def format_env_line(key, value):
    """Return a properly formatted 'key=value' line ending with a newline."""
    return f'{key}="{value}"\n'


def update_env_lines(lines, updates):
    """
    Update or append environment variable lines based on the updates dict.
    If a key is present, its value is updated; otherwise, a new line is appended.
    """
    updated_keys = set(updates.keys())
    new_lines = []
    for line in lines:
        # Preserve lines that are comments or not in key=value format.
        if '=' not in line or line.strip().startswith('#'):
            new_lines.append(line)
            continue

        key, _ = line.split('=', 1)
        key = key.strip()
        if key in updates:
            new_lines.append(format_env_line(key, updates[key]))
            updated_keys.remove(key)
        else:
            new_lines.append(line)

    if updated_keys:
        # Ensure file ends with a newline before appending new keys.
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines[-1] += "\n"
        for key in updated_keys:
            new_lines.append(format_env_line(key, updates[key]))
    return new_lines


def obtain_missing_values(env_vars):
    updates = {}

    # Generate SECRET_KEY if missing or empty.
    if "SECRET_KEY" not in env_vars or not env_vars["SECRET_KEY"]:
        updates["SECRET_KEY"] = generate_secret_key()

    # If any Postgres related key is missing, prompt for all Postgres keys.
    # We should ensure that all keys exist even if values are empty.
    if any(key_def["key"] not in env_vars for key_def in POSTGRES_KEYS):
        for key_def in POSTGRES_KEYS:
            key = key_def["key"]
            updates[key] = prompt_value(key_def)

    return updates


def main():
    check_env_file()
    lines, env_vars = read_env_file()
    updates = obtain_missing_values(env_vars)

    if not updates:
        sys.exit(0)

    new_lines = update_env_lines(lines, updates)
    write_env_file(new_lines)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("Exiting due to keyboard interruption")
