#!/usr/bin/env bash
set -euo pipefail

#<======THIS SECTION IS UPDATED DYNAMICALLY DURING PACKAGING===================

#< Replaced by the content of each shell script.
#< We are not using `source` directly because it's used in other parts of the code
#< during runtime, which we don't want to replace.
include_source "./install_utilities.sh"
include_source "./install_path_handler.sh"

MATHESAR_VERSION=___MATHESAR_VERSION___


#=======DEFAULTS===============================================================

PACKAGE_LINK="https://github.com/mathesar-foundation/mathesar/releases/download/${MATHESAR_VERSION}/mathesar.tar.gz"

# Allow system python versions >=3.9
# - If the user has the latest version, we assume they have the necessary knowledge
#   and requirements to also have `build-essential` installed.
# - If they run into issues, they could always trigger the install script with the `-f` flag
#   to force download python.
# - We only specify the lowest supported python version here.
SYSTEM_PYTHON_DETECTION_SPEC=">=3.9"

# For uv-managed versions, allow only 3.9 to 3.11
# When we download python, we always download 3.11
# These versions should always pass with the `SYSTEM_PYTHON_DETECTION_SPEC` version checks.
MANAGED_PYTHON_DETECTION_SPEC=">=3.9,<3.12"
MANAGED_DEFAULT_PYTHON_DOWNLOAD_VERSION="3.11"

VENV_DIR_NAME="mathesar-venv"
ENV_FILE_NAME=".env"

INSTALL_DIR=""
CONNECTION_STRING=""
NO_PROMPT=false
FORCE_DOWNLOAD_PYTHON=false


#=======USAGE==================================================================

usage() {
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

            For new installations, this flag needs to be used in conjunction with
            --connection-string, without which it'll throw an error.

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
  exit 2
}

usage_err() {
  danger "$1"
  usage
}


#=======ARGUMENT PARSING=======================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force-download-python|-f)
      FORCE_DOWNLOAD_PYTHON=true
      shift
      ;;
    --connection-string|-c)
      if [[ -n "$2" ]] && [[ "$2" != -* ]]; then
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
      usage
      ;;
    --test-package-location)
      if [[ -n "$2" ]] && [[ "$2" != -* ]]; then
        echo "============================================================================="
        echo "THE --test-package-location FLAG IS ONLY MEANT FOR TESTING. USE WITH CAUTION."
        echo "============================================================================="
        PACKAGE_LINK="$2"
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
      if [[ -z "${INSTALL_DIR}" ]]; then
        INSTALL_DIR="$1"
      else
        # INSTALL_DIR is not empty
        usage_err "Multiple install directories specified"
      fi
      shift
      ;;
  esac
done

if [[ -z "${INSTALL_DIR}" ]]; then
  usage_err "<install_dir> is required."
fi

if [[ ! -d "${INSTALL_DIR}" ]]; then
  err "The directory \"${INSTALL_DIR}\" does not exist. Please create it or specify a valid directory."
fi

if [[ ! -w "${INSTALL_DIR}" ]]; then
  err "You do not have sufficient permissions to create files in \"${INSTALL_DIR}\"."
fi


#=======COMPUTE ABSOLUTE PATHS & UV DIRS=======================================

INSTALL_DIR="$(cd -P "${INSTALL_DIR}" && pwd)"
UV_DIR="${INSTALL_DIR}"/uv
PACKAGE_DIR="${INSTALL_DIR}"/packages

# Required by uv
export UV_UNMANAGED_INSTALL="${UV_DIR}"
export UV_CACHE_DIR="${UV_DIR}"/cache
export UV_PYTHON_INSTALL_DIR="${UV_DIR}"/python
export UV_PROJECT_ENVIRONMENT="${INSTALL_DIR}"/"${VENV_DIR_NAME}"


#=======CORE FUNCTIONS=========================================================

check_required_commands() {
  info "Checking required commands..."
  require_command tar
  require_command rm
  require_command mkdir
  require_command env
  require_command touch
  require_command chmod
  require_command grep
  require_command cat
  require_command mktemp
  require_command tee
}

confirm() {
  while true; do
    read -rp "$1 [y/N] " reply
    case "$reply" in
      [Yy]*) break ;;
      [Nn]*) err "Installation aborted by user." ;;
      *) echo 'Please specify y or n' ;;
    esac
  done
}

check_connection_string_env_file_overwrite() {
  # .env file would be present while upgrading or re-install.
  # The user may have also chosen to write the env file first and then run the install script.

  local env_file="${INSTALL_DIR}"/"${ENV_FILE_NAME}"
  local env_file_is_present_and_has_postgres_vars=false

  if [[ -f "${env_file}" ]]; then
    if [[ ! -r "${env_file}" ]]; then
      err "You do not have read permission on the existing environment file: ${env_file}"
    fi

    if grep -qE '^POSTGRES_[A-Za-z]*=' "${env_file}"; then
      env_file_is_present_and_has_postgres_vars=true
    fi
  fi

  # 1. connection_string: provided     , env file: does not have pg vars => proceed & use connection_string
  # 2. connection_string: provided     , env file: has pg vars           => ask confirmation & use connection_string
  # 3. connection_string: not provided , env file: has pg vars           => proceed & use env file
  # 4. connection_string: not provided , env file: does not have pg vars => proceed & prompt for connection string (further down in code: setup_env_vars)
  #                                                                         (If prompting is not allowed i.e. NO_PROMPT == true, throw error)

  # When NO_PROMPT is true, proceed without confirmation in all cases above, except 4.
  if [[ "${NO_PROMPT}" == true ]]; then
    if [[ "${env_file_is_present_and_has_postgres_vars}" != true ]] && [[ -z "${CONNECTION_STRING}" ]]; then
      usage_err "For new installations, when --no-prompt|-n is specified, you must provide a connection string via --connection-string|-c."
    fi

    return
  fi

  if [[ "${env_file_is_present_and_has_postgres_vars}" == true ]] && [[ -n "${CONNECTION_STRING}" ]]; then
    cat <<EOF

You've provided a connection string via -c|--connection-string.
The installation directory already contains an environment file (.env) with existing variables for PostgreSQL connection settings.
If you continue, the existing variables will be replaced with the values from the connection string you provided.

EOF
    confirm "Would you like to proceed?"
  fi
}

preflight_checks() {
  check_connection_string_env_file_overwrite

  # Check if Mathesar is already installed in the <install_dir>
  # This check is based on the mathesar executable script, which would not be present in versions prior to 0.3.0
  if [[ -x "${INSTALL_DIR}/bin/mathesar" ]]; then
    local existing_bin="${INSTALL_DIR}/bin/mathesar"
    local installed_ver
    local status=0
    installed_ver=$(parse_mathesar_version "$existing_bin") || status=$?

    if [[ $status -ne 0 ]]; then
      err "Unable to determine version of existing Mathesar installation at ${existing_bin}. Aborting."
    fi

    info "Existing Mathesar detected in ${INSTALL_DIR} (version ${installed_ver})."
    local cmp_result
    cmp_result=$(compare_versions "${MATHESAR_VERSION}" "${installed_ver}")

    case $cmp_result in
      1)
        info "Upgrading Mathesar from \"${installed_ver}\" to \"${MATHESAR_VERSION}\"..."
        ;;
      0)
        info "Re-installing Mathesar \"${MATHESAR_VERSION}\". Your data will remain intact."
        ;;
      -1)
        err "Installed Mathesar version (${installed_ver}) is newer than the version in this script (${MATHESAR_VERSION}). Aborting."
        ;;
    esac
    return
  fi

  # Mathesar NOT present in <install_dir>, look for one in PATH
  if command_exists mathesar; then
    local other_bin
    other_bin=$(command -v mathesar)
    local other_ver
    other_ver=$(parse_mathesar_version "$other_bin") || other_ver="unknown"

    info "Another Mathesar installation was found at ${other_bin} (version ${other_ver})."
    info "The new installation will take precedence in PATH and may overwrite an existing symlink."

    if [[ "${NO_PROMPT}" == true ]]; then
      err "Refusing to continue because --no-prompt is set. Run without --no-prompt or remove the existing Mathesar first."
    fi

    confirm "Continue and install Mathesar ${MATHESAR_VERSION} to ${INSTALL_DIR}?"
  fi
}

create_directories() {
  info "Creating required directories..."
  run_cmd mkdir -p \
    "${PACKAGE_DIR}" \
    "${UV_DIR}" \
    "${UV_CACHE_DIR}" \
    "${UV_PYTHON_INSTALL_DIR}" \
    "${INSTALL_DIR}"/.media
}

download_and_extract_package() {
  local package="${PACKAGE_DIR}"/mathesar-"${MATHESAR_VERSION}".tar.gz

  info "Downloading Mathesar package ${MATHESAR_VERSION}..."
  download "${PACKAGE_LINK}" "${package}"

  info "Extracting package..."
  run_cmd tar -xzf "${package}" -C "${INSTALL_DIR}"
}

clear_uv_cache_lock() {
  # Clear uv cache directory, and lock file if present
  run_cmd rm -rf "${UV_CACHE_DIR}"/*
  if [[ -e "${INSTALL_DIR}"/uv.lock ]]; then
    run_cmd rm "${INSTALL_DIR}"/uv.lock
  fi
}

install_uv() {
  info "Installing uv..."
  clear_uv_cache_lock
  run_cmd env bash "${INSTALL_DIR}"/uv-installer.sh
}

download_python() {
  info "Downloading Python locally..."
  run_cmd "${UV_DIR}/uv" python install "${MANAGED_DEFAULT_PYTHON_DOWNLOAD_VERSION}"
}

ensure_python() {
  if [[ "${FORCE_DOWNLOAD_PYTHON}" == true ]]; then
    download_python
    return
  fi

  info "Finding existing Python installations..."

  local python_status=0
  "${UV_DIR}/uv" python find "${MANAGED_PYTHON_DETECTION_SPEC}" --managed-python 2>/dev/null || python_status=$?

  if [[ $python_status -eq 0 ]]; then
    info "Found Managed Python"
    return
  fi

  python_status=0
  "${UV_DIR}/uv" python find "${SYSTEM_PYTHON_DETECTION_SPEC}" --system 2>/dev/null || python_status=$?

  if [[ $python_status -eq 0 ]]; then
    info "Found System Python"
    # Important! Without this line, uv venv doesn't get generated correctly when using system python.
    unset UV_PYTHON_INSTALL_DIR
    return
  fi

  info "Python not detected"
  download_python
}

# Note: Once the venv is setup, directly invoke python from venv
# We no longer have to rely on uv after calling the following function
setup_venv_and_requirements() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Creating Python virtual environment..."
    run_cmd "${UV_DIR}/uv" venv ./"${VENV_DIR_NAME}" --python "${SYSTEM_PYTHON_DETECTION_SPEC}" --seed --relocatable

    info "Activating Python virtual environment..."
    # shellcheck source=/dev/null
    source ./"${VENV_DIR_NAME}"/bin/activate

    info "Installing Python packages..."
    run_cmd "${UV_DIR}/uv" pip install -r requirements.txt
  popd > /dev/null
}

process_env() {
  local conn_str_argument="$1"
  local updated_content
  local status=0

  updated_content=$(
    "${INSTALL_DIR}"/"${VENV_DIR_NAME}"/bin/python ./setup/process_env.py "$conn_str_argument" < "${INSTALL_DIR}"/"${ENV_FILE_NAME}"
  ) || status=$?

  if [[ "$status" -eq 0 ]]; then
    echo "$updated_content" > "${INSTALL_DIR}"/"${ENV_FILE_NAME}"
    info "Environment file updated successfully."
  fi

  return "$status"
}

setup_env_vars() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Setting up environment file (.env)..."
    run_cmd touch "${ENV_FILE_NAME}"

    if [[ ! -w "${ENV_FILE_NAME}" ]]; then
      err "No write permission for \"${ENV_FILE_NAME}\""
    fi

    local process_env_status=0

    if [[ -n "${CONNECTION_STRING}" ]]; then
      process_env "${CONNECTION_STRING}" || process_env_status=$?
    else
      # Verify the .env file without getting connection string from user.
      process_env "" || process_env_status=$?
    fi

    if [[ $process_env_status -ne 0 ]]; then
      if [[ "${NO_PROMPT}" == true ]]; then
        err "Invalid connection string or unable to connect."
      fi

      # If processing fails (for example, due to invalid or missing PG parameters),
      # repeatedly prompt the user for a valid PostgreSQL connection string.
      while true; do
        echo ""
        read -rep "Enter PostgreSQL connection string (format: postgres://user:password@host:port/dbname): " conn_str
        if [[ -z "$conn_str" ]]; then
          echo "Connection string cannot be empty. Please enter again."
          continue
        fi

        local inner_process_env_status=0
        process_env "$conn_str" || inner_process_env_status=$?

        if [[ $inner_process_env_status -eq 0 ]]; then
          break
        else
          echo "Invalid connection string or unable to connect. Please enter again."
        fi
      done
    fi

    info "Exporting environment variables to shell..."
    set -a
    # shellcheck source=/dev/null
    source "${ENV_FILE_NAME}"
    set +a

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
    run_cmd chmod +x ./bin/mathesar
  popd > /dev/null
}

#=======INSTALLATION===========================================================

check_required_commands
preflight_checks
create_directories
download_and_extract_package
install_uv
ensure_python
setup_venv_and_requirements
setup_env_vars
run_django_migrations
make_mathesar_script_executable
success "Mathesar's installed successfully!"

# Do this after displaying installation success message, since
# it's not mandatory, is failure prone, and user configurable
configure_path
