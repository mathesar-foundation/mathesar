#!/usr/bin/env bash
set -euo pipefail

# This script packages Mathesar as a distributable archive

# PRE-REQUSITES for running the script:
# - wget
# - python >= 3.9, with venv
# - node >= v18
# - GNU gettext
# - rsync
# - tar

export UV_VERSION=0.6.11

CALLING_DIR="$(pwd)"

# Move into the directory containing the package.sh script
cd "$(dirname "$0")"

DIST_LOCATION=./dist
PACKAGED_SOURCE_LOCATION="$DIST_LOCATION/__source__"
PYTHON_VENV_LOCATION="$DIST_LOCATION/__python__"

cleanup() {
  echo "Cleaning up temporary directories"
  rm -rf "$PACKAGED_SOURCE_LOCATION" "$PYTHON_VENV_LOCATION"

  echo "Move back into directory that called the script"
  cd "$CALLING_DIR"
}
trap cleanup EXIT

echo "Setting up dist folder"
mkdir -p "$DIST_LOCATION"
rm -rf "$DIST_LOCATION"/*

echo "Creating temp locations for source and python venv"
mkdir "$PACKAGED_SOURCE_LOCATION"
mkdir "$PYTHON_VENV_LOCATION"

echo "Obtaining uv install script"
wget "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/uv-installer.sh" -O "$PACKAGED_SOURCE_LOCATION/uv-installer.sh"

echo "Building frontend"
cd mathesar_ui && npm ci && npm run build && cd ..

echo "Setup python venv"
python -m venv "$PYTHON_VENV_LOCATION/mathesar-venv"
source "$PYTHON_VENV_LOCATION/mathesar-venv/bin/activate"

echo "Compiling translations"
pip install -r requirements.txt
python manage.py compilemessages

echo "Copying files"
FILES_TO_COPY=(
  "README.md"
  "LICENSE"
  "THIRDPARTY"
  "pyproject.toml"
  "uv.lock"
  "manage.py"
  "run-uv.sh"
  "requirements.txt"
)
cp "${FILES_TO_COPY[@]}" "$PACKAGED_SOURCE_LOCATION/"

echo "Copying directories"
DIRECTORIES_TO_COPY=(
  "LICENSES"
  "config"
  "db"
  "mathesar"
  "translations"
)
PATTERNS_TO_IGNORE=(
  "*.po"
  "__pycache__"
)
EXCLUDE_OPTS=()
for pattern in "${PATTERNS_TO_IGNORE[@]}"; do
    EXCLUDE_OPTS+=(--exclude="$pattern")
done
rsync -a "${EXCLUDE_OPTS[@]}" "${DIRECTORIES_TO_COPY[@]}" "$PACKAGED_SOURCE_LOCATION/"

echo "Produce a packaged tar file"
tar -C "$PACKAGED_SOURCE_LOCATION" -cvzf dist/mathesar.tar.gz .

echo "Packaged Mathesar successfully"
