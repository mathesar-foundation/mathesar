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

danger() {
  echo -e "${RED}$1${RESET}" >&2
}

err() {
  danger "ERROR: $1"
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

  local status=0
  local tmpfile
  tmpfile=$(mktemp) || { err "run_cmd: mktemp failed"; }

  # Why are we writing to a tempfile?
  # - This is because some scripts re-route stdout to stderr & vice-versa.
  # - Eg., uv installer has these lines: `say "downloading $APP_NAME $APP_VERSION ${_arch}" 1>&2`
  # - Even if we color only stderr and print stdout as it is, the stdout from the above line
  #   will still be colored. There's no way to control that behaviour from our scripts.
  # - So, we write all output to the tmpfile, while still displaying it, and reprint a colored
  #   output when there's a failure.

  ( "$@" 2>&1 | tee "$tmpfile" | sed 's/^/    /' ) || status=${PIPESTATUS[0]}

  if [[ $status -ne 0 ]]; then
    echo ""
    danger "The command '$*' failed with status '$status' with the following error,${RESET}"
    cat "$tmpfile" | (
      while IFS= read -r line; do
        danger "$line"
      done
    )
    echo -n ""
    err "Unable to continue"
  fi
}
