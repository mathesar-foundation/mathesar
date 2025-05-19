#!/usr/bin/env bash
set -euo pipefail

# Color definitions for output
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

err_msgonly() {
  echo -e "${RED}ERROR: $1${RESET}" >&2
}

err() {
  echo ""
  err_msgonly "$1"
  echo -e "${RED}Mathesar installation failed!${RESET}" >&2
  cat <<EOF

Refer Mathesar's documentation or reach out to the Mathesar team for additional support:
  * Documentation      : https://docs.mathesar.org
  * Github repo        : https://github.com/mathesar-foundation/mathesar
  * Community channels : https://mathesar.org/community

EOF
  exit 1
}

command_exists() {
  command -v "$1" > /dev/null 2>&1
  return $?
}

require_command() {
  if ! command_exists "$1"; then
    err "The script requires '$1' (command not found)"
  fi
}

# This function runs a supplied command, intends the output and colors stderr
run_cmd() {
  if [[ $# -eq 0 ]]; then
    # This should never happen in our code
    err "run_cmd: no command specified"
  fi

  local status

  set +e
  "$@" \
    2> >(
      while IFS= read -r line; do
        echo -e "${RED}    $1${RESET}" >&2
      done
    ) \
    | sed 's/^/    /'

  # Capture the exit status of the command, not sed
  status=${PIPESTATUS[0]}
  set -e

  if [[ $status -ne 0 ]]; then
    err "The command '$*' failed with status '$status'. Refer the lines above for the cause."
  fi
}
