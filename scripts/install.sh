#!/usr/bin/env bash
set -eo pipefail

# Do not call this script within your cloned git repo.
# This script will be called by the user directly from an external source (eg., internet link)

# If there's an existing installation,
# - If the script's Mathesar's version = installed version, it should perform all operations without affecting the installation.
#   - Useful if the user is facing environment related issues and would like to get them fixed.
#   - Running & re-running this script on a working Mathesar installation shoud have no effect on Mathesar itself.
# - If the script's Mathesar's version > installed version, it should upgrade Mathesar.
# - If the script's Mathesar's version < installed version, it should throw an error.

# The resulting directory structure would be as follows
# ---mathesar
#   |---uv
#   |---packages
#   |---mathesar-venv (could be renamed to just venv)
#   |---mathesar.sh
#   |---.env
#   |---.media
#   |---config
#   |---db
#   |---...(other source files)

# The parent directory (mathesar in the above structure) would need to exist.
# Users would have to cd into mathesar and run this script i.e. this would install Mathesar in the user's current directory.

#=======CONFIGURATIONS=========================================================

MATHESAR_VERSION="0.2.3"
REQUIRED_UV_VERSION="0.6.13"

INSTALL_DIR="$(pwd)"
UV_DIR="${INSTALL_DIR}"/uv
PACKAGE_DIR="${INSTALL_DIR}"/packages
PACKAGE_ARCHIVE="${PACKAGE_DIR}"/mathesar-"${MATHESAR_VERSION}".tar.gz

VENV_DIR_NAME="mathesar-venv"
LOG_FILE="install.log"

# Required by uv
export UV_UNMANAGED_INSTALL="${UV_DIR}"
export UV_CACHE_DIR="${UV_DIR}"/cache
export UV_PYTHON_INSTALL_DIR="${UV_DIR}"/python
export UV_PROJECT_ENVIRONMENT="${INSTALL_DIR}"/"${VENV_DIR_NAME}"

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
  echo -e "${RED}Mathesar installation failed!${RESET}"
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

# For commands that should ideally never fail
ensure() {
  if ! "$@"; then err "Command failed: $*"; fi
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


#=======CORE FUNCTIONS=========================================================

check_required_commands() {
  info "Checking required commands..."
  require_command tar
  require_command rm
  require_command mkdir
  require_command env
  require_command touch
  require_command chmod
}

create_directories() {
  info "Creating required directories..."
  ensure mkdir -p \
    "${PACKAGE_DIR}" \
    "${UV_DIR}" \
    "${UV_CACHE_DIR}" \
    "${UV_PYTHON_INSTALL_DIR}" \
    "${INSTALL_DIR}"/.media
}

download_and_extract_package() {
  # For production, replace the cp command with a call to download() e.g.:
  # download "http://example.com/path/to/mathesar-${MATHESAR_VERSION}.tar.gz" "${PACKAGE_ARCHIVE}"
  if [[ ! -f "${PACKAGE_ARCHIVE}" ]]; then
    info "Simulating download (for testing only)..."
    run_cmd cp "$(dirname "$0")/../dist/mathesar.tar.gz" "${PACKAGE_ARCHIVE}"
  else
    info "Package archive already exists."
  fi

  info "Extracting package..."
  run_cmd tar -xzf "${PACKAGE_ARCHIVE}" -C "${INSTALL_DIR}"
}

clear_uv_cache_lock() {
  # Clear uv cache directory, and lock file if present
  ensure rm -rf "${UV_CACHE_DIR}"/*
  [ -e "${INSTALL_DIR}"/uv.lock ] && ensure rm "${INSTALL_DIR}"/uv.lock
}

install_uv() {
  run_cmd /usr/bin/env sh "${INSTALL_DIR}"/uv-installer.sh
}

reinstall_uv() {
  clear_uv_cache_lock
  install_uv
}

install_uv_if_not_present() {
  # Install uv only if not already installed
  if [[ -x "${UV_DIR}"/uv ]]; then
    CURRENT_UV_VERSION=$("${UV_DIR}"/uv --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    if [[ "${CURRENT_UV_VERSION}" != "${REQUIRED_UV_VERSION}" ]]; then
      info "uv version (${CURRENT_UV_VERSION}) does not match required version (${REQUIRED_UV_VERSION})."
      info "Re-installing uv..."
      reinstall_uv
    else
      info "uv is already installed and up-to-date (${CURRENT_UV_VERSION})."
    fi
  else
    info "uv is not installed. Installing uv..."
    install_uv
  fi
}

find_python_and_configure_uv_vars() {
  info "Finding existing Python installations..."

  local python_status=0
  local find_cmd=("${UV_DIR}/uv" python find ">=3.9,<3.14")

  "${find_cmd[@]}" --managed-python || python_status=$?
  if [ $python_status -eq 0 ]; then
    info "Found Managed Python"
    return 0
  fi

  python_status=0
  "${find_cmd[@]}" --system || python_status=$?
  if [ $python_status -eq 0 ]; then
    info "Found System Python"
    # Important! Without this uv venv doesn't get generated correctly when using system python.
    unset UV_PYTHON_INSTALL_DIR
    return 0
  fi

  return 1
}

download_python_if_not_present() {
  local status=0
  find_python_and_configure_uv_vars || status=$?
  if [ $status -ne 0 ]; then
    info "Python not found. Downloading Python locally..."
    run_cmd "${UV_DIR}/uv" python install 3.13
  fi
}

# Note: Once the venv is setup, directly invoke python from venv
# We no longer have to rely on uv after calling the following function
setup_venv_requirements() {
  pushd "${INSTALL_DIR}" > /dev/null
    # System envs can be messed up! (TODO: Add a force download option)
    info "Creating Python virtual environment..."
    run_cmd "${UV_DIR}/uv" venv ./"${VENV_DIR_NAME}" --seed --relocatable
    ensure source ./"${VENV_DIR_NAME}"/bin/activate

    # Making explicit call here to use `uv add`.
    # `uv pip install` is buggy in Mac OS 14 - arm64 M1.
    # `uv add` also respects UV_PROJECT_ENVIRONMENT 
    info "Installing Python packages..."
    run_cmd "${UV_DIR}/uv" add -r requirements.txt
  popd > /dev/null
}

setup_env_vars() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Setting up environment configuration..."
    ensure touch ".env"

    ensure ./"${VENV_DIR_NAME}"/bin/python "./setup/fill_env.py"

    ensure set -a && ensure source .env && ensure set +a
  popd > /dev/null
}

run_django_migrations() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Running Django migrations & collecting static files..."
    local status=0
    ./"${VENV_DIR_NAME}"/bin/python -m mathesar.install &> "${LOG_FILE}" || status=$?
    if [ $status -ne 0 ]; then
      err "Unable to complete Django migrations. Refer ${LOG_FILE} for more information."
    fi
  popd > /dev/null
}

make_mathesar_script_executable() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Ensuring executable permissions..."
    ensure chmod +x ./mathesar.sh
  popd > /dev/null
}

#=======INSTALLATION===========================================================

# TODO: quiet mode and force modes
# TODO: Check if install dir is empty or throw a warning
# Ask user if they still want to proceed

download_and_install_mathesar() {
  ensure check_required_commands
  ensure create_directories
  ensure download_and_extract_package
  ensure install_uv_if_not_present
  ensure download_python_if_not_present
  ensure setup_venv_requirements
  ensure setup_env_vars
  ensure run_django_migrations
  ensure make_mathesar_script_executable

  success "Mathesar installation completed successfully!"
}

download_and_install_mathesar
