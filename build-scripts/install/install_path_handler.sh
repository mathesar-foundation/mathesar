#!/usr/bin/env bash
set -euo pipefail


#<=======THIS SECTION IS UPDATED DYNAMICALLY DURING PACKAGING==================

#< Replaced by the content of install_utilities.sh
#< We are not using `source` directly because it's used in other parts of the code
#< during runtime, which we don't want to replace.
include_source "./install_utilities.sh"


#=======INSTALL PATH HANDLER DEFAULTS==========================================

INSTALL_DIR=""


#=======PATH CONFIGURATION FUNCTIONS===========================================

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
  run_cmd chmod +x "${env_script}"
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
  run_cmd chmod +x "${fish_script}"
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
    write_mathesar_path_source_script

    if ! update_rcfiles; then
      path_set_success=false
      echo "Failed to update some shell configuration files. Please add the following line manually to your shell config:"
      echo "source \"${INSTALL_DIR}/bin/mathesar_path_source\""
    fi

    if command_exists fish; then
      write_mathesar_path_source_script_fish
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
      fi
    fi
  fi
  set -e
}
