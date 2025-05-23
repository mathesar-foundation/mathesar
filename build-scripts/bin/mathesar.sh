#!/usr/bin/env bash
set -eo pipefail

#< The location of this file after packaging will be `<install_root>/bin/mathesar`

#<======THIS SECTION IS UPDATED DYNAMICALLY DURING PACKAGING===================

include_source "../common_utilities.sh"


#=======CONFIGURATIONS=========================================================

MATHESAR_PORT=8000

SCRIPT_NAME=$(basename "$0")

# Default flag values.
NO_VENV=false
FALLBACK_TO_INBUILT_DOCKER_DB=false
SETUP_DJANGO=false
PREFER_EXPORTED_ENV=false


#=======SET LOCATION RELATED CONFIGURATIONS====================================

# Function to resolve a symlink to its absolute target
resolve_symlink() {
  local target="$1"
  while [[ -L "$target" ]]; do
    local dir
    dir="$(cd -P "$(dirname "$target")" && pwd)"
    local link
    # Do not use -f since it's not supported in mac/bsd
    link="$(readlink "$target")"
    # If the link is a relative path, prepend the directory path
    if [[ "$link" != /* ]]; then
      target="$dir/$link"
    else
      target="$link"
    fi
  done
  # Return the canonicalized absolute path
  cd -P "$(dirname "$target")" && echo "$(pwd)/$(basename "$target")"
}

# Determine the script's real path only if it's a symlink
if [[ -L "$0" ]]; then
  SCRIPT_PATH=$(resolve_symlink "$0")
else
  SCRIPT_PATH="$(cd -P "$(dirname "$0")" && pwd)/$(basename "$0")"
fi

# Now calculate the BASE_DIR relative to the actual script location
BASE_DIR="$(cd -P "$(dirname "$(dirname "${SCRIPT_PATH}")")" && pwd)"

ENV_FILE="${BASE_DIR}/.env"


#=======CORE FUNCTIONS=========================================================

select_python() {
  if [[ "${NO_VENV}" = true ]]; then
    echo "python3"
  else
    echo "${BASE_DIR}/mathesar-venv/bin/python"
  fi
}

# This function is for internal use in the script, eg., identifying version.
# This does not consider NO_VENV, which should be obeyed during `mathesar run`.
# Use `select_python` for python executions that need to be made during `mathesar run`.
auto_detect_python() {
  local venv_python="${BASE_DIR}/mathesar-venv/bin/python"

  if [[ -x "$venv_python" ]]; then
    echo "$venv_python"
  elif command_exists python3; then
    echo "python3"
  fi
}

get_mathesar_version() {
  local python_bin
  python_bin=$(auto_detect_python)

  if [[ -z "$python_bin" ]]; then
    echo "unknown"
    return
  fi

  local version
  pushd "${BASE_DIR}" > /dev/null
    version=$("$python_bin" -c "from mathesar import __version__; print(__version__)" 2>/dev/null || echo "unknown")
  popd > /dev/null

  echo "${version}"
}

print_mathesar_version() {
  local version
  version=$(get_mathesar_version)
  echo "Mathesar version ${version}"
}

set_env_vars_from_file() {
  if [[ -f "${ENV_FILE}" ]]; then
    info "Loading environment variables from ${ENV_FILE}"

    # Read .env file line by line.
    while IFS= read -r line || [ -n "$line" ]; do
      # Remove any leading and trailing whitespace.
      trimmed="$(echo "$line" | xargs)"

      # Skip blank lines and lines that start with '#' (comments).
      if [[ -z "$trimmed" ]] || [[ "$trimmed" == \#* ]]; then
        continue
      fi

      # Split the line at the first '=' to get the key and value.
      var_name="${trimmed%%=*}"
      var_value="${trimmed#*=}"

      # If PREFER_EXPORTED_ENV is true, only set from .env if variable is not already set.
      # If PREFER_EXPORTED_ENV is false, always set from .env
      # This check uses bash parameter expansion: if the variable is not set, ${!var_name+_} is empty.
      # If it's set even when empty, it'll return a value (when empty, it'll return _).
      # `!` is required below - it denotes that the value of var_name should be used as the env variable name.
      if [[ "${PREFER_EXPORTED_ENV}" = false ]] || [[ -z "${!var_name+_}" ]]; then
        export "$var_name"="$var_value"
      fi
    done < "${ENV_FILE}"
  fi
}

check_required_core_env_vars() {
  if [[ -z "${SECRET_KEY}" ]]; then
    err "Required environment variable SECRET_KEY is not set."
  fi
}

# Check that required PostgreSQL environment variables are present.
check_required_postgres_env_vars() {
  local missing=0

  for var in POSTGRES_USER POSTGRES_HOST POSTGRES_DB; do
    if [[ -z "${!var}" ]]; then
      echo "Required environment variable ${var} is not set."
      missing=1
    fi
  done

  return $missing
}

verify_docker_setup() {
  if [[ -z "${MATHESAR_DOCKER_IMAGE}" ]]; then
    err "Not running in a Mathesar docker container."
  fi

  # Verify that PGDATA is set; it's required to detect an existing DB.
  if [[ -z "${PGDATA}" ]]; then
    err "PGDATA is not set. Cannot verify existing database."
  fi

  declare -g DATABASE_ALREADY_EXISTS
  if [[ -s "${PGDATA}/PG_VERSION" ]]; then
    DATABASE_ALREADY_EXISTS='true'
  fi
}

initialize_inbuilt_db() {
  verify_docker_setup
  # only run initialization on an empty data directory
  if [[ -z "${DATABASE_ALREADY_EXISTS}" ]]; then
    pg_createcluster -d "${PGDATA}" -p 5432 -u "postgres" "${PG_MAJOR}" mathesar
    # Create a temporary postgres server for setting password to the postgres user and for creating the default database
    pg_ctlcluster "${PG_MAJOR}" mathesar start
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'mathesar';"
    sudo -u postgres psql -c "CREATE DATABASE mathesar_django;"
    pg_ctlcluster "${PG_MAJOR}" mathesar stop
  fi
  pg_ctlcluster "${PG_MAJOR}" mathesar start
}

select_gunicorn() {
  if [[ "${NO_VENV}" = true ]]; then
    echo "gunicorn"
  else
    echo "${BASE_DIR}/mathesar-venv/bin/gunicorn"
  fi
}

run_mathesar() {
  info "Starting Mathesar..."
  set_env_vars_from_file
  check_required_core_env_vars

  if ! check_required_postgres_env_vars; then
    if [[ "${FALLBACK_TO_INBUILT_DOCKER_DB}" = true ]]; then
      info "Fallback enabled: Starting inbuilt database..."
      initialize_inbuilt_db
      export POSTGRES_USER=postgres
      export POSTGRES_PASSWORD=mathesar
      export POSTGRES_HOST=localhost
      export POSTGRES_PORT=5432
      export POSTGRES_DB=mathesar_django
    else
      err "Required environment variables are not set."
    fi
  fi

  # Run Django setup if the flag is provided.
  if [[ "${SETUP_DJANGO}" = true ]]; then
    local python_bin
    python_bin=$(select_python)

    if [[ "${NO_VENV}" != true ]] && [[ ! -x "${python_bin}" ]]; then
      err "Python not found at ${python_bin}. Ensure the virtual environment is set up."
    fi

    pushd "${BASE_DIR}" > /dev/null
      info "Running Django setup..."
      run_cmd "$python_bin" -m mathesar.install
    popd > /dev/null
  fi

  local gunicorn_args
  gunicorn_args=(
    config.wsgi
    -b "0.0.0.0:${MATHESAR_PORT}"
    --chdir "${BASE_DIR}"
  )
  if [[ "${DEBUG}" = "true" ]]; then
    gunicorn_args+=("--log-level=debug")
  fi

  local gunicorn_bin
  gunicorn_bin=$(select_gunicorn)

  if [[ "${NO_VENV}" != true ]] && [[ ! -x "${gunicorn_bin}" ]]; then
    err "Gunicorn not found at ${gunicorn_bin}. Ensure the virtual environment is set up."
  fi

  info "Starting gunicorn webserver..."
  exec "$gunicorn_bin" "${gunicorn_args[@]}"
}


#=======USAGE==================================================================

usage_msg() {
local version
version=$(get_mathesar_version)

cat <<EOF
Mathesar - ${version}

An intuitive spreadsheet-like interface that lets users of all technical skill levels view, edit,
query, and collaborate on Postgres data directly, with native Postgres access controls.

Open source, self-hosted, and maintained by Mathesar Foundation, a 501(c)(3) nonprofit.

Usage: ${SCRIPT_NAME} <command> [options]

Commands:
  run [options]
      Run Mathesar.

      Options:
        --port <port>, -p <port>        Specify the port for Mathesar's web service (default is 8000).

      Advanced options (for CI/CD):
        --prefer-exported-env, -e       Prefer existing exported environment variables over the .env file.
                                        If this option is set and required environment variables aren't exported,
                                        the values from the .env file will be substituted for the missing ones.

        --fallback-to-inbuilt-db, -f    If set and the required PostgreSQL environment variables are missing,
                                        falls back to starting the inbuilt database from Mathesar's Docker image
                                        and exports default values.

        --no-venv, -n                   Use the system gunicorn (from the PATH) rather than the one in the
                                        virtual environment.

        --setup-django, -s              Run "python -m mathesar.install" to set up Django.

  version
      Show version information.

  help
      Show this help message.

Examples:
  ${SCRIPT_NAME} run -p 9000
      # Runs using gunicorn from the virtual environment on port 9000.

  ${SCRIPT_NAME} run --no-venv
      # Runs using system gunicorn.

  ${SCRIPT_NAME} run --fallback-to-inbuilt-db --port 9000 --setup-django
      # Falls back to an inbuilt DB if PostgreSQL env vars are missing,
      # uses port 9000, and runs Django setup.

  ${SCRIPT_NAME} run -fns -p 8080
      # Combines short options for fallback, no-venv, and setup-django with port 8080.

Links:
  Documentation : docs.mathesar.org
  Website       : mathesar.org
  Github repo   : github.com/mathesar-foundation/mathesar

EOF
}

usage_err() {
  danger "$1"
  usage_msg
  exit 2
}


#=======ARGUMENT PARSING AND COMMAND EXECUTION=================================

# If no command is specified, print help and exit
if [ $# -eq 0 ]; then
  usage_msg
  exit 2
fi

COMMAND="$1"
shift

if [ "${COMMAND}" = "run" ]; then
  # Parse run command options.
  while [ $# -gt 0 ]; do
    case "$1" in
      --no-venv|-n)
        NO_VENV=true
        shift
        ;;
      --fallback-to-inbuilt-db|-f)
        FALLBACK_TO_INBUILT_DOCKER_DB=true
        shift
        ;;
      --setup-django|-s)
        SETUP_DJANGO=true
        shift
        ;;
      --port|-p)
        if [ -n "$2" ]; then
          MATHESAR_PORT="$2"
          shift 2
        else
          usage_err "The --port/-p option requires an argument."
        fi
        ;;
      --prefer-exported-env|-e)
        PREFER_EXPORTED_ENV=true
        shift
        ;;
      -*)
        # Support combined short options for fallback (-f), no-venv (-n), prefer-exported-env (-e), and setup-django (-s).
        # Eg., `mathesar run -fnes`.
        # Don't allow `p` in the the option string since `-p` requires an argument.
        shortopts="${1#-}"
        if [[ "$shortopts" == *"p"* ]]; then
          usage_err "The -p option cannot be combined with other options. Please specify it separately, eg., 'mathesar -e -p 8000'."
        fi
        for (( i=0; i<${#shortopts}; i++ )); do
          letter="${shortopts:i:1}"
          case "$letter" in
            f) FALLBACK_TO_INBUILT_DOCKER_DB=true ;;
            n) NO_VENV=true ;;
            s) SETUP_DJANGO=true ;;
            e) PREFER_EXPORTED_ENV=true ;;
            *)
              usage_err "Unknown option: -$letter"
              ;;
          esac
        done
        shift
        ;;
      *)
        usage_err "Unknown option: $1"
        ;;
    esac
  done
fi

case "${COMMAND}" in
  run)
    run_mathesar
    ;;
  version)
    print_mathesar_version
    ;;
  help)
    usage_msg
    ;;
  *)
    usage_err "Unknown command: ${COMMAND}"
    ;;
esac
