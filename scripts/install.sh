#!/usr/bin/env bash
set -eo pipefail

# This script will be called by the user directly from the GH releases link (or a link from our website).

# If there's an existing installation in the same location,
# - If the script's Mathesar's version = installed version, it performs all operations without affecting the installation.
#   - Useful if the user is facing environment related issues and would like to get them fixed.
#   - Running & re-running this script on a working Mathesar installation would have no effect on Mathesar itself.
# - If the script's Mathesar version > installed version, it updates the installed version with the one on this script.
# - If the script's Mathesar version < installed version, it throws an error and stops.

# If there's an existing installation in a different location, it shows a message and prompts the user to continue.

# The resulting directory structure would be as follows:
#
# ── mathesar/ (parent installation directory - must exist)
#    ├── bin/
#    │   ├── mathesar                   (main executable bash script)
#    │   ├── mathesar_path_source       (path setting script for sh-like shells)
#    │   └── mathesar_path_source.fish  (path setting script for fish - if fish is installed)
#    ├── uv/
#    ├── packages/
#    ├── mathesar-venv/
#    ├── .env
#    ├── .media
#    ├── config/
#    ├── db/
#    ├── mathesar/
#    └── ... (other source files)

# For Maintainers:
# - Portions of this script are updated dynamically by `package.sh`.
# - Do not call this script within your cloned git repo.
# - Avoid testing on the Mathesar dev environment since existing environment variables
#   would interfere with the new installation.


#=======CONFIGURATIONS=========================================================

# This is replaced during packaging
MATHESAR_VERSION=___MATHESAR_VERSION___
REQUIRED_UV_VERSION=___UV_VERSION___

PYTHON_VERSION_SPECIFIER=">=3.9"
VENV_DIR_NAME="mathesar-venv"
ENV_FILE_NAME=".env"

FORCE_DOWNLOAD_PYTHON=false
CONNECTION_STRING=""
NO_PROMPT=false
PACKAGE_LOCATION="https://github.com/mathesar-foundation/mathesar/releases/download/${MATHESAR_VERSION}/mathesar.tar.gz"

# This is called before installation
set_install_dir() {
  INSTALL_DIR="$(cd -P "$1" && pwd)"

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
  if [[ $status -ne 0 ]]; then
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

parse_mathesar_version() {
  local bin_path="$1"
  "$bin_path" version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || return 1
}

compare_versions() {
  local v1="$1" v2="$2"
  if [[ "$v1" == "$v2" ]]; then
    return 0
  fi
  local greatest
  greatest=$(printf '%s\n%s\n' "$v1" "$v2" | sort -V | tail -n1)
  if [[ "$greatest" == "$v1" ]]; then
    return 1 # v1 newer
  else
    return -1 # v1 older
  fi
}

preflight_version_checks() {
  # Check if Mathesar is already installed in the <install_dir>
  if [[ -x "${INSTALL_DIR}/bin/mathesar" ]]; then
    local existing_bin="${INSTALL_DIR}/bin/mathesar"
    set +e
    local installed_ver status
    installed_ver=$(parse_mathesar_version "$existing_bin")
    status=$?
    set -e

    if [[ $status -ne 0 ]]; then
      info "Unable to determine version of existing Mathesar at ${existing_bin}. Proceeding with installation..."
      return
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

  # 2. Mathesar NOT present in <install_dir>; look for one in PATH
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

    while true; do
      read -rp "Continue and install Mathesar ${MATHESAR_VERSION} to ${INSTALL_DIR}? [y/N] " reply
      case "$reply" in
        [Yy]*) break ;;
        [Nn]*|"") err "Installation aborted by user." ;;
      esac
    done
  fi
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
  [[ -e "${INSTALL_DIR}"/uv.lock ]] && ensure rm "${INSTALL_DIR}"/uv.lock
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
    CURRENT_UV_VERSION=$("${UV_DIR}"/uv self version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
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

  local python_status
  local find_cmd=("${UV_DIR}/uv" python find "${PYTHON_VERSION_SPECIFIER}")

  set +e
  "${find_cmd[@]}" --managed-python 2>/dev/null
  python_status=$?
  set -e

  if [[ $python_status -eq 0 ]]; then
    info "Found Managed Python"
    return 0
  fi

  set +e
  "${find_cmd[@]}" --system 2>/dev/null
  python_status=$?
  set -e

  if [[ $python_status -eq 0 ]]; then
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
  if [[ "$FORCE_DOWNLOAD_PYTHON" = true ]]; then
    download_python
  else
    local status

    # Find existing python installations
    set +e
    find_python_and_configure_uv_vars
    status=$?
    set -e

    if [[ $status -ne 0 ]]; then
      info "Python not found"
      download_python
    fi
  fi
}

# Note: Once the venv is setup, directly invoke python from venv
# We no longer have to rely on uv after calling the following function
setup_venv_requirements() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Creating Python virtual environment..."
    run_cmd "${UV_DIR}/uv" venv ./"${VENV_DIR_NAME}" --python "${PYTHON_VERSION_SPECIFIER}" --seed --relocatable

    info "Activating Python virtual environment..."
    ensure source ./"${VENV_DIR_NAME}"/bin/activate

    info "Installing Python packages..."
    run_cmd "${UV_DIR}/uv" pip install -r requirements.txt
  popd > /dev/null
}

process_env() {
  local conn_str_argument="$1"
  local updated_content status
  
  set +e
  updated_content=$(cat "${INSTALL_DIR}"/"${ENV_FILE_NAME}" | "${INSTALL_DIR}"/"${VENV_DIR_NAME}"/bin/python ./setup/process_env.py "$conn_str_argument")
  status=$?
  set -e

  if [[ $status -ne 0 ]]; then
    return $status
  fi

  echo "$updated_content" > "${INSTALL_DIR}"/"${ENV_FILE_NAME}"
  info "Environment file updated successfully."
  
  return 0
}

setup_env_vars() {
  pushd "${INSTALL_DIR}" > /dev/null
    info "Setting up .env file..."
    ensure touch "${ENV_FILE_NAME}"

    if [[ ! -w "${ENV_FILE_NAME}" ]]; then
      err "No write permission for \"${ENV_FILE_NAME}\""
    fi

    local process_env_status

    set +e
    if [[ -n "${CONNECTION_STRING}" ]]; then
      process_env "${CONNECTION_STRING}"
      process_env_status=$?
    else
      # Verify the .env file without getting connection string from user.
      # Suppress printing output here.
      process_env "" > /dev/null 2>&1
      process_env_status=$?
    fi
    set -e

    if [[ $process_env_status -ne 0 ]]; then
      if [[ "${NO_PROMPT}" = true ]]; then
        err "Invalid connection string or unable to connect."
      fi

      # If processing fails (for example, due to invalid or missing PG parameters),
      # repeatedly prompt the user for a valid PostgreSQL connection string.
      while true; do
        echo ""
        read -ep "Enter PostgreSQL connection string (format: postgres://user:password@host:port/dbname): " conn_str
        if [[ -z "$conn_str" ]]; then
          err_msgonly "Connection string cannot be empty. Please enter again."
          continue
        fi

        set +e
        process_env "$conn_str"
        process_env_status=$?
        set -e

        if [[ $process_env_status -eq 0 ]]; then
          break
        else
          err_msgonly "Invalid connection string or unable to connect. Please enter again."
        fi
      done
    fi

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
    ensure chmod +x ./bin/mathesar
  popd > /dev/null
}

write_mathesar_path_source_script() {
  local env_script="${INSTALL_DIR}/bin/mathesar_path_source"
  info "Writing Mathesar environment script (sh) to ${env_script}..."
  cat <<EOF > "${env_script}"
#!/bin/sh
# This script adds Mathesar's bin directory to PATH if not already present.
case ":\${PATH}:" in
  *:"${INSTALL_DIR}/bin":*)
    ;;
  *)
    export PATH="${INSTALL_DIR}/bin:\${PATH}"
    ;;
esac
EOF
  ensure chmod +x "${env_script}"
}

write_mathesar_path_source_script_fish() {
  local fish_script="${INSTALL_DIR}/bin/mathesar_path_source.fish"
  info "Writing Mathesar environment script (fish) to ${fish_script}..."
  cat <<EOF > "${fish_script}"
# This script adds Mathesar's bin directory to PATH in fish if not already present.
if not contains "${INSTALL_DIR}/bin" \$PATH
    set -x PATH "${INSTALL_DIR}/bin" \$PATH
end
EOF
  ensure chmod +x "${fish_script}"
}

# Update shell configuration files (rcfiles) to source the Mathesar environment script.
update_rcfiles() {
  info "Updating shell configuration files to source Mathesar environment script..."
  local sh_rc_files=(".bashrc" ".bash_profile" ".profile" ".zshrc" ".zshenv")
  local source_line_sh="source \"${INSTALL_DIR}/bin/mathesar_path_source\""
  local success_rc=true
  for rc in "${sh_rc_files[@]}"; do
    local rcfile="$HOME/$rc"
    if [[ -f "$rcfile" ]]; then
      if ! grep -Fq "$source_line_sh" "$rcfile"; then
        if ! echo -e "\n$source_line_sh" >> "$rcfile"; then
          echo "Warning: Failed to update $rcfile. Please add the following line manually:"
          echo "$source_line_sh"
          success_rc=false
        else
          echo "Updated $rcfile."
        fi
      fi
    fi
  done
  $success_rc && return 0 || return 1
}

# Do we really need to support fish? We could ask users to do it themselves. 
update_fish_config() {
  local fish_conf_dir="$HOME/.config/fish/conf.d"
  if ! mkdir -p "$fish_conf_dir"; then
    echo "Warning: Unable to create fish config directory. Please manually copy ${INSTALL_DIR}/bin/mathesar_path_source.fish to your fish configuration directory."
    return 1
  fi
  local fish_target="${fish_conf_dir}/mathesar_path_source.fish"
  if ! cp "${INSTALL_DIR}/bin/mathesar_path_source.fish" "$fish_target"; then
    echo "Warning: Unable to copy mathesar_path_source.fish to $fish_target. Please copy it manually."
    return 1
  else
    info "Installed Mathesar fish environment script to ${fish_target}."
    return 0
  fi
}

update_current_shell_env() {
  local current_shell
  current_shell=$(basename "$SHELL")

  if [[ "$current_shell" == "fish" ]]; then
    if command_exists fish; then
      if ! fish -c "source ${INSTALL_DIR}/bin/mathesar_path_source.fish"; then
        echo "Warning: Unable to source mathesar_path_source.fish in the current fish session."
        echo "Please run: source \"${INSTALL_DIR}/bin/mathesar_path_source.fish\" or restart your shell."
        return 1
      fi
    fi
  elif ! . "${INSTALL_DIR}/bin/mathesar_path_source"; then
    echo "Warning: Unable to source mathesar_path_source in the current session."
    echo "Please run: source \"${INSTALL_DIR}/bin/mathesar_path_source\" or restart your shell"
    return 1
  fi

  # Re-exec the shell if interactive
  if [[ $- == *i* ]] && [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    info "Restarting the shell to apply PATH changes..."
    exec "$SHELL" -l || {
      echo "Warning: Unable to restart the shell automatically. Please run: source \"${INSTALL_DIR}/bin/mathesar_path_source\""
      return 1
    }
  fi

  return 0
}

is_valid_candidate_dir_for_symlink() {
  local candidate="$1"
  if [[ -z "$candidate" ]]; then
    return 1
  fi
  if [[ ! -d "$candidate" ]]; then
    mkdir -p "$candidate" 2>/dev/null || return 1
  fi
  if [[ ! -w "$candidate" ]]; then
    return 1
  fi
  # Only pass candidate that is already in PATH
  if [[ ":$PATH:" == *":$candidate:"* ]]; then
    return 0
  else
    return 1
  fi
}

determine_symlink_dir() {
  local candidates=()

  # Candidate 1: XDG_BIN_HOME (if defined).
  if [[ -n "${XDG_BIN_HOME:-}" ]]; then
    candidates+=("${XDG_BIN_HOME}")
  fi

  # Candidate 2: The bin directory in the parent of XDG_DATA_HOME.
  if [[ -n "${XDG_DATA_HOME:-}" ]]; then
    candidates+=("$(dirname "${XDG_DATA_HOME}")/bin")
  fi

  # Candidate 3: HOME/.local/bin.
  if [[ -n "${HOME:-}" ]]; then
    candidates+=("${HOME}/.local/bin")
  fi

  for candidate in "${candidates[@]}"; do
    if is_valid_candidate_dir_for_symlink "$candidate"; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

configure_path() {
  set +e
  local symlink_success=false
  local target_dir
  target_dir=$(determine_symlink_dir)

  if [[ -n "$target_dir" ]]; then
    info "Attempting to add a symlink in ${target_dir}..."
    if ln -sf "${INSTALL_DIR}/bin/mathesar" "${target_dir}/mathesar"; then
      success "Symlink created at ${target_dir}/mathesar."
      symlink_success=true
    else
      info "Warning: Unable to create symlink in ${target_dir}."
    fi
  fi

  if ! $symlink_success; then
    info "Attempting to add \"${INSTALL_DIR}/bin\" to PATH..."

    local path_set_success=true
    ensure write_mathesar_path_source_script

    if ! update_rcfiles; then
      path_set_success=false
      echo "Failed to update some shell configuration files. Please add the following line manually to your shell config:"
      echo "source \"${INSTALL_DIR}/bin/mathesar_path_source\""
    fi

    if command_exists fish; then
      ensure write_mathesar_path_source_script_fish
      if ! update_fish_config; then
        path_set_success=false
        echo "Failed to update fish configuration. Please copy ${INSTALL_DIR}/bin/mathesar_path_source.fish into your fish configuration manually."
      fi
    fi

    if $path_set_success; then
      success "Shell configurations for PATH set succesfully"
  
      info "Attempting to update the current shell environment..."
      if update_current_shell_env; then
        success "Everything's ready, you can now start Mathesar by executing \"mathesar run\"."
        echo "Use \"mathesar help\" for more information.".
        echo "Please restart your shell if the 'mathesar' command is not found."
      else
        echo "Unable to automatically update the current shell environment."
        echo "Please run the following command in your terminal to update your PATH:"
        echo "source \"${INSTALL_DIR}/bin/mathesar_path_source\""
        echo "Please restart your shell if the 'mathesar' command is still not found."
      fi
    fi
  fi
  set -e
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
  exit 2
}

# Iterate through all provided arguments.
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
      usage_msg
      exit 0
      ;;
    --test-package-location)
      if [[ -n "$2" ]] && [[ "$2" != -* ]]; then
        echo "============================================================================="
        echo "THE --test-package-location FLAG IS ONLY MEANT FOR TESTING. USE WITH CAUTION."
        echo "============================================================================="
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
      if [[ -z "$INSTALL_DIR" ]]; then
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
if [[ "${NO_PROMPT}" = true ]] && [[ -z "${CONNECTION_STRING}" ]]; then
  usage_err "When --no-prompt(or -n) is specified, you must provide a connection string via --connection-string(or -c)."
fi

if [[ -z "${INSTALL_DIR}" ]]; then
  usage_err "<install_dir> is required."
fi

if [[ ! -d "${INSTALL_DIR}" ]]; then
  err "The directory \"${INSTALL_DIR}\" does not exist. Please create it or specify a valid directory."
fi

if [[ ! -w "${INSTALL_DIR}" ]]; then
  err "You do not have sufficient permissions to create files in \"${INSTALL_DIR}\"."
fi


#=======INSTALLATION===========================================================

ensure check_required_commands
ensure preflight_version_checks
ensure create_directories
ensure download_and_extract_package
ensure install_uv_if_not_present
ensure download_python_if_needed
ensure setup_venv_requirements
ensure setup_env_vars
ensure run_django_migrations
ensure make_mathesar_script_executable
success "Mathesar's installed successfully!"

# Do this after displaying installation success message
# since it's failure prone and user configurable
ensure configure_path
