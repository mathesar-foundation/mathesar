#!/usr/bin/env bash
set -euo pipefail

# This script packages Mathesar as a distributable archive
# Primary purpose is to run on our CI/CD


#=======CONFIGURATIONS=========================================================

export UV_VERSION=0.6.11
export FILES_TO_COPY=(
  "LICENSE"
  "manage.py"
  "mathesar.sh"
  "pyproject.toml"
  "README.md"
  "run-uv.sh"
  "requirements.txt"
  "THIRDPARTY"
)
export DIRECTORIES_TO_COPY=(
  "config"
  "db"
  "mathesar"
  "setup"
  "translations"
  "LICENSES"
)
export PATTERNS_TO_IGNORE=(
  "*.po"
  "__pycache__"
)
export DIST_LOCATION="$(dirname "$0")/../dist"

#=======COMMON UTILITIES=======================================================

RED=$(tput setaf 1 2>/dev/null || echo "")
GREEN=$(tput setaf 2 2>/dev/null || echo "")
BLUE=$(tput setaf 4 2>/dev/null || echo "")
RESET=$(tput sgr0 2>/dev/null || echo "")

info() {
  echo -e "${BLUE}==> $1${RESET}"
}

success() {
  echo -e "${GREEN}==> $1${RESET}"
}

err() {
  echo -e "${RED}ERROR: $1${RESET}" >&2
  echo -e "${RED}Mathesar packaging failed!${RESET}"
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

info "Setting up dist folder"
mkdir -p "${DIST_LOCATION}"
rm -rf "${DIST_LOCATION}"/*

info "Creating temp locations for source and python venv"

PACKAGED_SOURCE_LOCATION="${DIST_LOCATION}/__source__"
PYTHON_VENV_LOCATION="${DIST_LOCATION}/__python__"

mkdir "${PACKAGED_SOURCE_LOCATION}"
mkdir "${PYTHON_VENV_LOCATION}"

info "Moving into source directory"

CALLING_DIR="$(pwd)"
# Move into the mathesar repo base directory.
# - The parent directory to the scripts directory that
#   contains the package.sh script
cd "$(dirname "$0")/.."

cleanup() {
  info "Cleaning up temporary directories"
  rm -rf "${PACKAGED_SOURCE_LOCATION}" "${PYTHON_VENV_LOCATION}"

  info "Moving back into directory that called the script"
  cd "${CALLING_DIR}"
}
trap cleanup EXIT


#=======PACKAGING FUNCTION=====================================================

package_mathesar() {
  info "Obtaining uv install script"
  wget "https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/uv-installer.sh" -O "${PACKAGED_SOURCE_LOCATION}/uv-installer.sh"

  info "Building frontend"
  cd mathesar_ui && npm ci && npm run build && cd ..

  info "Compiling translations"
  pip install -r requirements.txt
  python manage.py compilemessages

  info "Copying files"
  cp "${FILES_TO_COPY[@]}" "${PACKAGED_SOURCE_LOCATION}/"

  info "Copying directories"
  EXCLUDE_OPTS=()
  for pattern in "${PATTERNS_TO_IGNORE[@]}"; do
    EXCLUDE_OPTS+=(--exclude="$pattern")
  done
  rsync -a "${EXCLUDE_OPTS[@]}" "${DIRECTORIES_TO_COPY[@]}" "${PACKAGED_SOURCE_LOCATION}/"

  info "Producing a packaged tar file"
  tar -C "${PACKAGED_SOURCE_LOCATION}" -cvzf "${DIST_LOCATION}/mathesar.tar.gz" .

  success "Packaged Mathesar successfully"
}


#=======ACTUAL PACKAGE CALL====================================================

package_mathesar
