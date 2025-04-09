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

VENV_DIR_NAME="mathesar-venv"

FORCE_DOWNLOAD_PYTHON=false
CONNECTION_STRING=""
NO_PROMPT=false
PACKAGE_LOCATION="https://github.com/mathesar-foundation/mathesar/releases/download/${MATHESAR_VERSION}/mathesar.tar.gz"

# This is called before installation
set_install_dir() {
  INSTALL_DIR="$1"

  UV_DIR="${INSTALL_DIR}"/uv
  PACKAGE_DIR="${INSTALL_DIR}"/packages
  PACKAGE_LOCAL_ARCHIVE="${PACKAGE_DIR}"/mathesar-"${MATHESAR_VERSION}".tar.gz

  # Required by uv
  export UV_UNMANAGED_INSTALL="${UV_DIR}"
  export UV_CACHE_DIR="${UV_DIR}"/cache
  export UV_PYTHON_INSTALL_DIR="${UV_DIR}"/python
  export UV_PROJECT_ENVIRONMENT="${INSTALL_DIR}"/"${VENV_DIR_NAME}"
}

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

err_msgonly() {
  echo -e "${RED}ERROR: $1${RESET}" >&2
}

err() {
  err_msgonly "$1"
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
  if [[ ! -f "${PACKAGE_LOCAL_ARCHIVE}" ]]; then
    info "Downloading Mathesar package ${MATHESAR_VERSION}..."
    download "${PACKAGE_LOCATION}" "${PACKAGE_LOCAL_ARCHIVE}"
  else
    info "Package archive already exists."
  fi

  info "Extracting package..."
  run_cmd tar -xzf "${PACKAGE_LOCAL_ARCHIVE}" -C "${INSTALL_DIR}"
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

  "${find_cmd[@]}" --managed-python 2>/dev/null || python_status=$?
  if [ $python_status -eq 0 ]; then
    info "Found Managed Python"
    return 0
  fi

  python_status=0
  "${find_cmd[@]}" --system 2>/dev/null || python_status=$?
  if [ $python_status -eq 0 ]; then
    info "Found System Python"
    # Important! Without this uv venv doesn't get generated correctly when using system python.
    unset UV_PYTHON_INSTALL_DIR
    return 0
  fi

  return 1
}

download_python() {
  info "Downloading Python locally..."
  run_cmd "${UV_DIR}/uv" python install 3.13
}

download_python_if_needed() {
  if [ "$FORCE_DOWNLOAD_PYTHON" = true ]; then
    download_python
  else
    local status=0
    # Find existing python installations
    find_python_and_configure_uv_vars || status=$?
    if [ $status -ne 0 ]; then
      info "Python not found"
      download_python
    fi
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
    info "Setting up .env file..."
    ensure touch ".env"

    ensure ./"${VENV_DIR_NAME}"/bin/python ./setup/fill_env.py

    info "Exporting environment variables to shell..."
    ensure set -a && ensure source .env && ensure set +a
  popd > /dev/null
}

run_django_migrations() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Running Django migrations & collecting static files..."
    run_cmd ./"${VENV_DIR_NAME}"/bin/python -m mathesar.install
  popd > /dev/null
}

make_mathesar_script_executable() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Ensuring executable permissions..."
    ensure chmod +x ./mathesar.sh
  popd > /dev/null
}


#=======ARGUMENT PARSING=======================================================

usage_msg() {
cat <<EOF

install.sh

The installer for Mathesar "${MATHESAR_VERSION}".

USAGE:
    install.sh <install_dir>
      [--connection-string <value> | -c <value>]
      [--no-prompt | -n]
      [--force-download-python | -f]
      [--help | -h]

ARGUMENTS:
    <install_dir>
        Specify the directory into which Mathesar needs to be installed.

FLAGS:
    -c, --connection-string
            Specify PostgreSQL connection string for Mathesar's Django database.

            A <value> needs to be passed to this flag.

    -n, --no-prompt
            Disable prompting. Useful for CI/CD environments.

            The install script prompts for environment variables like the connection
            string when it's missing or invalid. This flag disables that behaviour.

            This flag needs to be used in conjunction with --connection-string, without
            which it'll throw an error.

    -f, --force-download-python
            Always download Python.

            By default, the install script detects existing Python installations to use,
            and only downloads Python if there isn't a compatible version found.

            This flag forces download of Python even if a compatible version is found.
            The Python binaries are placed within the Mathesar installation directory and
            do not affect any system settings.

    -h, --help
            Print help information.

EOF
}

usage_err() {
  err_msgonly "$1"
  usage_msg
  exit 1
}

# Iterate through all provided arguments.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force-download-python|-f)
      FORCE_DOWNLOAD_PYTHON=true
      shift
      ;;
    --connection-string|-c)
      if [ -n "$2" ] && [[ "$2" != -* ]]; then
        CONNECTION_STRING="$2"
        shift 2
      else
        usage_err "--connection-string requires a non-empty argument."
      fi
      ;;
    --no-prompt|-n)
      NO_PROMPT=true
      shift
      ;;
    --help|-h)
      usage_msg
      exit 0
      ;;
    --test-package-location)
      if [ -n "$2" ] && [[ "$2" != -* ]]; then
        echo "THIS FLAG IS ONLY MEANT FOR TESTING. USE WITH CAUTION."
        PACKAGE_LOCATION="$2"
        shift 2
      else
        usage_err "--test-package-location requires a non-empty argument."
      fi
      ;;
    -*)
      usage_err "Unknown flag: $1"
      ;;
    *)
      # Assume any non-flag is the installation directory.
      if [ -z "$INSTALL_DIR" ]; then
        set_install_dir "$1"
      else
        # INSTALL_DIR is not empty
        usage_err "Improper configuration of Installation directory"
      fi
      shift
      ;;
  esac
done

# If --no-prompt is enabled, a connection string is mandatory.
if [ "${NO_PROMPT}" = true ] && [ -z "${CONNECTION_STRING}" ]; then
  usage_err "When --no-prompt(or -n) is specified, you must provide a connection string via --connection-string(or -c)."
fi

if [ -z "${INSTALL_DIR}" ]; then
  usage_err "<install_dir> is required."
fi

if [ ! -d "${INSTALL_DIR}" ]; then
  err "The directory \"${INSTALL_DIR}\" does not exist. Please create it or specify a valid directory."
fi

if [ ! -w "${INSTALL_DIR}" ]; then
  err "You do not have sufficient permissions to create files in \"${INSTALL_DIR}\"."
fi


#=======INSTALLATION===========================================================

ensure check_required_commands
ensure create_directories
ensure download_and_extract_package
ensure install_uv_if_not_present
ensure download_python_if_needed
ensure setup_venv_requirements
ensure setup_env_vars
ensure run_django_migrations
ensure make_mathesar_script_executable

success "Mathesar installation completed successfully!"
