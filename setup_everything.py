import os
import subprocess
import sys

# -------- CONFIG --------
DB_NAME = "mathesar_db"
DB_USER = "mathesar_user"
DB_PASSWORD = "yourpassword"
DB_HOST = "127.0.0.1"
DB_PORT = "5432"

LOCAL_SETTINGS_PATH = "config/settings/local.py"
# ------------------------

def run_cmd(cmd, sudo=False):
    if sudo:
        cmd = ["sudo"] + cmd
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("Error:", result.stderr.strip())
    return result

def install_postgresql():
    print("\n--- Installing PostgreSQL if not installed ---")
    run_cmd(["apt", "update"], sudo=True)
    run_cmd(["apt", "install", "-y", "postgresql", "postgresql-contrib", "libpq-dev"], sudo=True)

def create_db_user():
    print("\n--- Creating PostgreSQL DB and User ---")
    # Create user
    run_cmd(["sudo", "-u", "postgres", "psql", "-c", f"CREATE USER {DB_USER} WITH PASSWORD '{DB_PASSWORD}';"])
    # Create database
    run_cmd(["sudo", "-u", "postgres", "psql", "-c", f"CREATE DATABASE {DB_NAME} OWNER {DB_USER};"])
    # Grant privileges
    run_cmd(["sudo", "-u", "postgres", "psql", "-c", f"GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};"])

def create_local_settings():
    print("\n--- Creating local.py settings ---")
    os.makedirs(os.path.dirname(LOCAL_SETTINGS_PATH), exist_ok=True)
    content = f"""
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': '{DB_NAME}',
        'USER': '{DB_USER}',
        'PASSWORD': '{DB_PASSWORD}',
        'HOST': '{DB_HOST}',
        'PORT': '{DB_PORT}',
    }}
}}
"""
    with open(LOCAL_SETTINGS_PATH, "w") as f:
        f.write(content.strip())
    print(f"{LOCAL_SETTINGS_PATH} created successfully!")

def run_migrations():
    print("\n--- Running Django Migrations ---")
    run_cmd([sys.executable, "manage.py", "makemigrations"])
    run_cmd([sys.executable, "manage.py", "migrate"])

def run_tests():
    print("\n--- Running Django Tests ---")
    run_cmd([sys.executable, "manage.py", "test"])

if __name__ == "__main__":
    install_postgresql()
    create_db_user()
    create_local_settings()
    run_migrations()
    run_tests()
    print("\n✅ All done! Your Django project should be working now.")
