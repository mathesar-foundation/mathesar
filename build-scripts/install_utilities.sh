#!/usr/bin/env bash
set -euo pipefail


#<=======THIS SECTION IS UPDATED DYNAMICALLY DURING PACKAGING==================

#< Replaced by the content of common_utilities.sh
source "./common_utilities.sh"


#=======INSTALL UTILITY FUNCTIONS==============================================

# grep returns all matches here. Make it return only first match
parse_mathesar_version() {
  local bin_path="$1"
  "$bin_path" version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || return 1
}

compare_versions() {
  local v1="$1" v2="$2"
  if [[ "$v1" == "$v2" ]]; then
    echo 0
    return
  fi
  local greatest
  greatest=$(printf '%s\n%s\n' "$v1" "$v2" | sort -V | tail -n1)
  if [[ "$greatest" == "$v1" ]]; then
     # v1 newer
    echo 1
  else
    # v1 older
    echo -1
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
