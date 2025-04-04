#!/usr/bin/env bash
set -euo pipefail

# This script packages Mathesar as a distributable archive
# Primary purpose is to run on our CI/CD


#=======CONFIGURATIONS=========================================================

export UV_VERSION=0.6.11
export FILES_TO_COPY=(
  "README.md"
  "LICENSE"
  "THIRDPARTY"
  "manage.py"
  "pyproject.toml"
  "run-uv.sh"
  "requirements.txt"
)
export DIRECTORIES_TO_COPY=(
  "LICENSES"
  "config"
  "db"
  "mathesar"
  "translations"
  "setup"
)
export PATTERNS_TO_IGNORE=(
  "*.po"
  "__pycache__"
)


#=======COMMON UTILITIES=======================================================

err() {
  local red
  local reset
  red=$(tput setaf 1 2>/dev/null || echo '')
  reset=$(tput sgr0 2>/dev/null || echo '')
  echo -e "${red}ERROR: $1${reset}" >&2
  exit 1
}

command_exists() {
  command -v "$1" > /dev/null 2>&1
  return $?
}

require_command() {
  if ! command_exists "$1"; then
    err "The package script requires '$1' (command not found)"
  fi
}


#=======PRE-REQUSITES==========================================================

# PRE-REQUSITES for running the script:
# - wget
# - python >= 3.9, with venv
# - node >= v18
# - GNU gettext
# - rsync
# - tar

require_command wget
require_command python
require_command npm
require_command gettext
require_command rsync
require_command tar


#=======SETUP DIRECTORY STRUCTURE==============================================

CALLING_DIR="$(pwd)"

# Move into the mathesar repo base directory.
# - The parent directory to the scripts directory that
#   contains the package.sh script
cd "$(dirname "$0")/.."

DIST_LOCATION=./dist
PACKAGED_SOURCE_LOCATION="$DIST_LOCATION/__source__"
PYTHON_VENV_LOCATION="$DIST_LOCATION/__python__"

echo "Setting up dist folder"
mkdir -p "$DIST_LOCATION"
rm -rf "$DIST_LOCATION"/*

echo "Creating temp locations for source and python venv"
mkdir "$PACKAGED_SOURCE_LOCATION"
mkdir "$PYTHON_VENV_LOCATION"

cleanup() {
  echo "Cleaning up temporary directories"
  rm -rf "$PACKAGED_SOURCE_LOCATION" "$PYTHON_VENV_LOCATION"

  echo "Move back into directory that called the script"
  cd "$CALLING_DIR"
}
trap cleanup EXIT


#=======PACKAGING FUNCTION=====================================================

package_mathesar() {
  echo "Obtaining uv install script"
  wget "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/uv-installer.sh" -O "$PACKAGED_SOURCE_LOCATION/uv-installer.sh"

  echo "Building frontend"
  cd mathesar_ui && npm ci && npm run build && cd ..

  echo "Compiling translations"
  pip install -r requirements.txt
  python manage.py compilemessages

  echo "Copying files"
  cp "${FILES_TO_COPY[@]}" "$PACKAGED_SOURCE_LOCATION/"

  echo "Copying directories"
  EXCLUDE_OPTS=()
  for pattern in "${PATTERNS_TO_IGNORE[@]}"; do
    EXCLUDE_OPTS+=(--exclude="$pattern")
  done
  rsync -a "${EXCLUDE_OPTS[@]}" "${DIRECTORIES_TO_COPY[@]}" "$PACKAGED_SOURCE_LOCATION/"

  echo "Produce a packaged tar file"
  tar -C "$PACKAGED_SOURCE_LOCATION" -cvzf dist/mathesar.tar.gz .

  echo "Packaged Mathesar successfully"
}


#=======ACTUAL PACKAGE CALL====================================================

package_mathesar || err "Packaging Failed"
