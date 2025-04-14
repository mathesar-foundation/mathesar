#!/usr/bin/env bash
set -eo pipefail

#=======CONFIGURATIONS=========================================================

MATHESAR_VERSION="0.2.3"
MATHESAR_PORT=8000

SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Default flag values.
NO_VENV=false
FALLBACK_TO_INBUILT_DOCKER_DB=false
SETUP_DJANGO=false

# Color definitions for output
RED=$(tput setaf 1 2>/dev/null || echo "")
BLUE=$(tput setaf 4 2>/dev/null || echo "")
RESET=$(tput sgr0 2>/dev/null || echo "")


#=======COMMON UTILITIES=======================================================

info() {
  echo -e "${BLUE}==> $1${RESET}"
}

err() {
  echo -e "${RED}ERROR: $1${RESET}" >&2
  exit 1
}

command_exists() {
  command -v "$1" > /dev/null 2>&1
  return $?
}


#=======CORE FUNCTIONS=========================================================

validate_port() {
  if ! [[ "${MATHESAR_PORT}" =~ ^[0-9]+$ ]]; then
    err "Invalid port: ${MATHESAR_PORT}. Port must be a positive integer."
  fi

  if command_exists lsof; then
    if lsof -i tcp:"${MATHESAR_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
      err "Port ${MATHESAR_PORT} is already in use. Please choose a different port."
    fi
  else
    echo "lsof is not installed. Skipping port-in-use check."
  fi
}

check_required_core_env_vars() {
  if [[ -z "${SECRET_KEY}" ]]; then
    err "Required environment variable "${SECRET_KEY}" is not set."
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
    err "Cannot verify environment as Mathesar's docker image."
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

select_python() {
  if [[ "${NO_VENV}" = true ]]; then
    echo "python"
  else
    echo "${SCRIPT_DIR}/mathesar-venv/bin/python"
  fi
}

select_gunicorn() {
  if [[ "${NO_VENV}" = true ]]; then
    echo "gunicorn"
  else
    echo "${SCRIPT_DIR}/mathesar-venv/bin/gunicorn"
  fi
}

run_mathesar() {
  info "Starting Mathesar..."
  validate_port
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

    info "Running Django setup..."
    exec "$python_bin" -m mathesar.install
  fi

  local gunicorn_opts="config.wsgi -b 0.0.0.0:${MATHESAR_PORT}"
  if [ "${DEBUG}" = "true" ]; then
    gunicorn_opts+=" --log-level=debug"
  fi

  local gunicorn_bin
  gunicorn_bin=$(select_gunicorn)

  if [[ "${NO_VENV}" != true ]] && [[ ! -x "${gunicorn_bin}" ]]; then
    err "Gunicorn not found at ${gunicorn_bin}. Ensure the virtual environment is set up."
  fi

  info "Starting gunicorn webserver..."
  exec "$gunicorn_bin" $gunicorn_opts
}

#=======ARGUMENT PARSING AND MAIN COMMMAND=====================================

# This is the help message printed for the user
usage_msg() {
cat <<EOF

Mathesar - ${MATHESAR_VERSION}

An intuitive spreadsheet-like interface that lets users of all technical skill levels view, edit,
query, and collaborate on Postgres data directly, with native Postgres access controls.

Open source, self-hosted, and maintained by Mathesar Foundation, a 501(c)(3) nonprofit.

Usage: ${SCRIPT_NAME} <command> [options]

Commands:
  run [--port <port> | -p <port>]
      Run Mathesar.

      Options:
        --port <port>, -p <port>    Specify the port for Mathesar's web service (default is 8000).

  version
      Show version information.

  help
      Show this help message.

Links:
  Documentation : docs.mathesar.org
  Website       : mathesar.org
  Github repo   : github.com/mathesar-foundation/mathesar

EOF
}

usage_internal_msg()  {
usage_msg

cat <<EOF
Internal commands and options used by the Mathesar team and for anyone digging around for advanced operations.

Internal commands and options:
  run [--fallback-to-inbuilt-db | -f] [--no-venv | -n] [--setup-django | -s] [--port <port> | -p <port>]
      Run Mathesar.

      By default, Mathesar assumes it runs outside our Docker image, and expects that all
      required environment variables are set and uses gunicorn from the virtual environment.

      Options:
        --fallback-to-inbuilt-db, -f   If set and the required PostgreSQL environment
                                       variables are missing, fallback to starting
                                       the inbuilt database from our Docker image and
                                       exports default values.

        --no-venv, -n                  Use the system gunicorn (from the PATH) rather
                                       than the one in the virtual environment.

        --setup-django, -s             Run "python -m mathesar.install" to set up Django.

        --port <port>, -p <port>       Specify the port for Gunicorn (default is 8000).
                                       NOTE: This option must be provided as a separate token.

  help-internal
      Show these internal commands and options.

Examples:
  ${SCRIPT_NAME} run
      # Runs using gunicorn from the virtual environment on port 8000.

  ${SCRIPT_NAME} run --no-venv
      # Runs using system gunicorn.

  ${SCRIPT_NAME} run --fallback-to-inbuilt-db --port 9000 --setup-django
      # Falls back to an inbuilt DB if PostgreSQL env vars are missing,
      # uses port 9000, and runs Django setup.

  ${SCRIPT_NAME} run -fns -p 8080
      # Combines short options for fallback, no-venv, and setup-django with port 8080.

EOF
}

# If no command is specified, print help and exit
if [ $# -eq 0 ]; then
  usage_msg
  exit 0
fi

COMMAND="$1"
shift

if [ "$COMMAND" = "run" ]; then
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
          err "The --port/-p option requires an argument."
        fi
        ;;
      -*)
        # Support clubbed short options for fallback (-f), no-venv (-n), and setup-django (-s).
        # If the option string includes any 'p' we now no longer allow clubbing.
        shortopts="${1#-}"
        if [[ "$shortopts" == *"p"* ]]; then
          err "The -p option cannot be clubbed with other options."
        fi
        for (( i=0; i<${#shortopts}; i++ )); do
          letter="${shortopts:i:1}"
          case "$letter" in
            f) FALLBACK_TO_INBUILT_DOCKER_DB=true ;;
            n) NO_VENV=true ;;
            s) SETUP_DJANGO=true ;;
            *)
              echo "Unknown option: -$letter"
              usage_msg
              exit 1
              ;;
          esac
        done
        shift
        ;;
      *)
        echo "Unknown option: $1"
        usage_msg
        exit 1
        ;;
    esac
  done
fi

case "${COMMAND}" in
  run)
    run_mathesar
    ;;
  version)
    echo "Mathesar version ${MATHESAR_VERSION}"
    ;;
  help)
    usage_msg
    ;;
  help-internal)
    usage_internal_msg
    ;;
  *)
    echo "Unknown command: ${COMMAND}"
    usage_msg
    exit 1
    ;;
esac
