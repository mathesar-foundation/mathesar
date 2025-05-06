#!/usr/bin/env bash
set -euo pipefail

# This script packages Mathesar as a distributable archive and generates
# an install.sh script that installs the archive

# Primary purpose is to run on our CI/CD
# For dev & test purposes, execute within Mathesar docker container

#=======CONFIGURATIONS=========================================================

export UV_VERSION=0.7.2
export FILES_TO_COPY=(
  "LICENSE"
  "manage.py"
  "pyproject.toml"
  "README.md"
  "requirements.txt"
  "THIRDPARTY"
)
export DIRECTORIES_TO_COPY=(
  "bin"
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
  "bin/mathesar_dev"
)
export INSTALLATION_RAW_INPUT_FILE="scripts/install.sh"

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export DIST_LOCATION="${BASE_DIR}/dist"

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
# - sed

require_command wget
require_command python
require_command npm
require_command gettext
require_command msgfmt
require_command rsync
require_command tar
require_command sed


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
cd "${BASE_DIR}"

cleanup() {
  info "Cleaning up temporary directories"
  rm -rf "${PACKAGED_SOURCE_LOCATION}" "${PYTHON_VENV_LOCATION}"

  info "Moving back into directory that called the script"
  cd "${CALLING_DIR}"
}
trap cleanup EXIT


#=======PACKAGING FUNCTIONS====================================================

generate_install_script_with_substitutions() {
  local generated_install_file="${DIST_LOCATION}/install.sh"
  local mathesar_version

  if ! mathesar_version=$(python -c "from mathesar import __version__; print(__version__)"); then
    err "Unable to detect Mathesar version"
  fi

  declare -A substitutions=(
    ["___MATHESAR_VERSION___"]="${mathesar_version}"
    ["___UV_VERSION___"]="${UV_VERSION}"
  )

  # Build sed expression
  local sed_args=()
  for key in "${!substitutions[@]}"; do
    sed_args+=("-e" "s|$key|\"${substitutions[$key]}\"|g")
  done

  sed "${sed_args[@]}" "${INSTALLATION_RAW_INPUT_FILE}" > "$generated_install_file"
  chmod +x "$generated_install_file"
  echo "Generated $generated_install_file with substitutions"
}

package_mathesar() {
  info "Obtaining uv install script"
  wget "https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/uv-installer.sh" -O "${PACKAGED_SOURCE_LOCATION}/uv-installer.sh"

  info "Building frontend"
  pushd mathesar_ui > /dev/null
    npm ci
    npm run build
  popd > /dev/null

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

  info "Generate install.sh file"
  generate_install_script_with_substitutions

  success "Packaged Mathesar successfully"
}


#=======ACTUAL PACKAGE CALL====================================================

package_mathesar
