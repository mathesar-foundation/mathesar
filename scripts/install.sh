#!/usr/bin/env bash
set -euo pipefail

# Do not call this script within your cloned git repo.

# This script will be called by the user directly from an external source (eg., internet link)
# Do not assume any directory structure or try to access any other project files from
# this script.

# If there's an existing installation,
# - If the script's Mathesar's version = installed version, it should perform all operations without affecting the installation.
#   - Useful if the user is facing environment related issues and would like to get them fixed.
#   - Running & re-running this script on a working Mathesar installation shoud have no effect on Mathesar itself.
# - If the script's Mathesar's version > installed version, it should upgrade Mathesar.
# - If the script's Mathesar's version < installed version, it should throw an error.

#=======CONFIGURATIONS=========================================================

export INSTALLATION_DIRECTORY_NAME="mathesar-1"
export MATHESAR_VERSION="0.2.3"
export REQUIRED_UV_VERSION="0.6.11"

INSTALL_DIR="$(pwd)/${INSTALLATION_DIRECTORY_NAME}"

# Color definitions for output
RED=$(tput setaf 1 2>/dev/null || echo "")
GREEN=$(tput setaf 2 2>/dev/null || echo "")
BLUE=$(tput setaf 4 2>/dev/null || echo "")
RESET=$(tput sgr0 2>/dev/null || echo "")


#=======COMMON UTILITIES=======================================================

info() {
  echo -e "${BLUE}==> $1${RESET}"
}

success() {
  echo -e "${GREEN}==> $1${RESET}"
}

err() {
  echo -e "${RED}ERROR: $1${RESET}" >&2
  exit 1
}

command_exists() {
  command -v "$1" > /dev/null 2>&1
  return $?
}

require_command() {
  if ! command_exists "$1"; then
    err "The install script requires '$1' (command not found)"
  fi
}

run_cmd() {
  # Execute the command, pipe output to indent each line with 4 spaces.
  "$@" 2>&1 | sed 's/^/    /'
  local status=${PIPESTATUS[0]}
  if [ $status -ne 0 ]; then
    err "Command failed: $*"
  fi
}

download() {
  if command_exists curl; then
    info "Downloading from $1 (using curl)..."
    run_cmd curl -sSfL "$1" -o "$2"
  elif command_exists wget; then
    info "Downloading from $1 (using wget)..."
    run_cmd wget "$1" -O "$2"
  else
    require_command "curl or wget"
  fi
}


#=======INSTALLER==============================================================

download_and_install_mathesar() {
  info "Checking required commands..."
  require_command tar
  require_command rm
  require_command mkdir
  require_command env
  require_command touch

  info "Creating installation directories..."
  mkdir -p \
    "${INSTALL_DIR}" \
    "${INSTALL_DIR}/packages" \
    "${INSTALL_DIR}/uv" \
    "${INSTALL_DIR}/uv/cache" \
    "${INSTALL_DIR}/uv/python" \
    "${INSTALL_DIR}/source" \
    "${INSTALL_DIR}/source/.media"

  # Download the package archive
  PACKAGE_ARCHIVE="${INSTALL_DIR}/packages/mathesar-${MATHESAR_VERSION}.tar.gz"

  # For production, replace the cp command with a call to download() e.g.:
  # download "http://example.com/path/to/mathesar-${MATHESAR_VERSION}.tar.gz" "${PACKAGE_ARCHIVE}"
  if [[ ! -f "${PACKAGE_ARCHIVE}" ]]; then
    info "Simulating download (for testing only)..."
    run_cmd cp ../dist/mathesar.tar.gz "${PACKAGE_ARCHIVE}" || err "Failed to copy mathesar.tar.gz; file not found."
  else
    info "Package archive already exists."
  fi

  info "Extracting package..."
  run_cmd tar -xzf "${PACKAGE_ARCHIVE}" -C "${INSTALL_DIR}/source"

  # Set up environment variables for uv tool
  export UV_CACHE_DIR="${INSTALL_DIR}/uv/cache"
  export UV_PYTHON_INSTALL_DIR="${INSTALL_DIR}/uv/python"
  export UV_UNMANAGED_INSTALL="${INSTALL_DIR}/uv"
  export UV_PROJECT_ENVIRONMENT="${INSTALL_DIR}/source/mathesar-venv"

  #-------Check if uv is installed--------------------#
  if [[ -x "${INSTALL_DIR}/uv/uv" ]]; then
    CURRENT_UV_VERSION=$("${INSTALL_DIR}/uv/uv" --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    if [[ "$CURRENT_UV_VERSION" != "${REQUIRED_UV_VERSION}" ]]; then
      info "uv version (${CURRENT_UV_VERSION}) does not match required version (${REQUIRED_UV_VERSION}). Updating uv..."
      run_cmd /usr/bin/env sh "${INSTALL_DIR}/source/uv-installer.sh"
    else
      info "uv is already installed and up-to-date (${CURRENT_UV_VERSION})."
    fi
  else
    info "uv is not installed. Installing uv..."
    run_cmd /usr/bin/env sh "${INSTALL_DIR}/source/uv-installer.sh"
  fi

  # TODO: Check using uv & check venv
  # TODO: Check if venv is already present, if yes, check if it's valid and activate
  # If venv is not present, create one if python is present in global + managed envs
  # If python is not present, download python
  info "Installing Python 3.13 using uv..."
  run_cmd "${INSTALL_DIR}/uv/uv" python install 3.13

  #-------Created venv and setup requirements--------------------#
  pushd "${INSTALL_DIR}/source" > /dev/null
    info "Creating Python virtual environment..."
    run_cmd "${INSTALL_DIR}/uv/uv" venv "${INSTALL_DIR}/source/mathesar-venv"
    source "${INSTALL_DIR}/source/mathesar-venv/bin/activate"

    info "Installing Python packages..."
    run_cmd "${INSTALL_DIR}/uv/uv" pip install -r requirements.txt

    info "Setting up environment configuration..."
    # Ensure .env file exists and is filled in by the provided script.
    run_cmd touch ".env"
    "${INSTALL_DIR}/uv/uv" run "./setup/fill_env.py"

    set -a && source .env && set +a 

    info "Running Django migrations & collecting static files"
    "${INSTALL_DIR}/uv/uv" run -m mathesar.install
  popd > /dev/null

  success "Mathesar installation completed successfully!"
}


#=======ACTUAL INSTALLATION CALL===============================================

download_and_install_mathesar || err "Mathesar installation failed"
