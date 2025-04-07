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

export MATHESAR_VERSION="0.2.3"
export REQUIRED_UV_VERSION="0.6.11"
# Install everything in current working directory
export INSTALL_DIR="$(pwd)"
LOG_FILE="install.log"

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
  require_command chmod

  # TODO: quiet mode and force modes
  # TODO: Check if install dir is empty or throw a warning
  # Ask user if they still want to proceed

  info "Creating required directories..."
  mkdir -p \
    "${INSTALL_DIR}/packages" \
    "${INSTALL_DIR}/uv" \
    "${INSTALL_DIR}/uv/cache" \
    "${INSTALL_DIR}/uv/python" \
    "${INSTALL_DIR}/.media" \

  UV_DIR="${INSTALL_DIR}/uv"

  # Package archive location
  PACKAGE_ARCHIVE="${INSTALL_DIR}/packages/mathesar-${MATHESAR_VERSION}.tar.gz"

  # For production, replace the cp command with a call to download() e.g.:
  # download "http://example.com/path/to/mathesar-${MATHESAR_VERSION}.tar.gz" "${PACKAGE_ARCHIVE}"
  if [[ ! -f "${PACKAGE_ARCHIVE}" ]]; then
    info "Simulating download (for testing only)..."
    run_cmd cp "$(dirname "$0")/../dist/mathesar.tar.gz" "${PACKAGE_ARCHIVE}" || err "Failed to copy mathesar.tar.gz; file not found."
  else
    info "Package archive already exists."
  fi

  info "Extracting package..."
  run_cmd tar -xzf "${PACKAGE_ARCHIVE}" -C "${INSTALL_DIR}"

  # Set up environment variables for uv
  export UV_UNMANAGED_INSTALL="${UV_DIR}"
  export UV_CACHE_DIR="${UV_DIR}/cache"
  export UV_PYTHON_INSTALL_DIR="${UV_DIR}/python"
  export UV_PROJECT_ENVIRONMENT="${INSTALL_DIR}/mathesar-venv"

  #-------Check if uv is installed--------------------#
  if [[ -x "${UV_DIR}/uv" ]]; then
    CURRENT_UV_VERSION=$("${UV_DIR}/uv" --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    if [[ "$CURRENT_UV_VERSION" != "${REQUIRED_UV_VERSION}" ]]; then
      info "uv version (${CURRENT_UV_VERSION}) does not match required version (${REQUIRED_UV_VERSION})"
      info "Removing and re-installing uv"
      run_cmd rm -rf "${UV_DIR}/cache/*"
      run_cmd rm "${UV_DIR}/uv" "${UV_DIR}/uvx"
      run_cmd /usr/bin/env sh "${INSTALL_DIR}/uv-installer.sh"
    else
      info "uv is already installed and up-to-date (${CURRENT_UV_VERSION})."
    fi
  else
    info "uv is not installed. Installing uv..."
    run_cmd /usr/bin/env sh "${INSTALL_DIR}/uv-installer.sh"
  fi

  # TODO: Check using uv & check venv
  # TODO: Check if venv is already present, if yes, check if it's valid and activate
  # If venv is not present, create one if python is present in global + managed envs
  # If python is not present, download python
  info "Finding existing Python installations..."
  
  find_supported_python() {
    local lower_minor=9 # From 3.9
    local upper_minor=13 # Till 3.13
    local version path

    # Loop through potential minor versions: 3.9, 3.10, 3.11, etc.
    for minor in $(seq $lower_minor $upper_minor); do
      version="3.$minor"
      path=$("${UV_DIR}/uv" python find "$version" 2>/dev/null)
      if [ $? -eq 0 ]; then
        return 0
      fi
    done

    # Python not found
    return 1
  }

  supported_python_version=$(find_supported_python)
  if [ $? -ne 0 ]; then
    info "Python not found. Installing python..."
    run_cmd "${UV_DIR}/uv" python install 3.13
  fi

  #-------Creating venv and setting up requirements--------------------#
  # Moving into INSTALL_DIR since it could be different from working dir when we let user configure it
  pushd "${INSTALL_DIR}" > /dev/null
    info "Creating Python virtual environment..."
    run_cmd "${UV_DIR}/uv" venv ./mathesar-venv
    source ./mathesar-venv/bin/activate

    info "Installing Python packages..."
    run_cmd "${UV_DIR}/uv" pip install -r requirements.txt

    # Note: Once the venv is setup and packages are installed, directly invoke python from venv
    # We no longer have to rely on uv after this is done

    info "Setting up environment configuration..."
    run_cmd touch ".env"

    ./mathesar-venv/bin/python "./setup/fill_env.py"

    set -a && source .env && set +a

    info "Running Django migrations & collecting static files..."
    local status=0
    ./mathesar-venv/bin/python -m mathesar.install &> "${LOG_FILE}" || status=$?
    if [ $status -ne 0 ]; then
      err "Unable to complete Django migrations. Refer ${LOG_FILE} for more information."
    fi

    info "Ensuring executable permissions..."
    chmod +x ./mathesar.sh
  popd > /dev/null

  success "Mathesar installation completed successfully!"
}


#=======ACTUAL INSTALLATION CALL===============================================

download_and_install_mathesar
