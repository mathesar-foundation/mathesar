#!/usr/bin/env python3

import re
import subprocess
import json

DICT_PATH = "mathesar_ui/src/i18n/languages/en/dict.json"
CONFLICTS_PATH = "mathesar_ui/src/i18n/languages/en/dict.conflicts.json"


def cmd(parts):
    return subprocess.run(parts, capture_output=True).stdout.decode().strip()


def get_commit_id(rev):
    return cmd(["git", "rev-parse", rev])


def get_merge_base(rev1, rev2):
    return cmd(["git", "merge-base", rev1, rev2])


def get_dict_at_commit(commit):
    return json.loads(cmd(["git", "show", f"{commit}:{DICT_PATH}"]))


current_rev = None
incoming_rev = None

# Needs to be opened in text read mode
with open(DICT_PATH, "r") as f:
    for line in f:
        if not current_rev:
            match = re.search(r"^<<<<<<< (\w+)", line)
            if match:
                current_rev = match.group(1)
                continue
        if not incoming_rev:
            match = re.search(r"^>>>>>>> (\w+)", line)
            if match:
                incoming_rev = match.group(1)
                continue
        if current_rev and incoming_rev:
            break

if not current_rev and not incoming_rev:
    print("No merge conflict detected.")
    exit(0)

current_commit = get_commit_id(current_rev)
incoming_commit = get_commit_id(incoming_rev)
base_commit = get_merge_base(current_commit, incoming_commit)

base_dict = get_dict_at_commit(base_commit)
current_dict = get_dict_at_commit(current_commit)
incoming_dict = get_dict_at_commit(incoming_commit)

merged_dict = {}
conflicts = {}
keys = base_dict.keys() | current_dict.keys() | incoming_dict.keys()

# This does a three way merge on a per-item basis
for key in keys:
    base_value = base_dict.get(key)
    current_value = current_dict.get(key)
    incoming_value = incoming_dict.get(key)

    # New values are equal
    if current_value == incoming_value:
        if current_value:
            merged_dict[key] = current_value
        continue

    # Only one new value exists
    if current_value and not incoming_value:
        merged_dict[key] = current_value
        continue
    if incoming_value and not current_value:
        merged_dict[key] = incoming_value
        continue

    # Only one value changed
    if current_value == base_value:
        merged_dict[key] = incoming_value
        continue
    if incoming_value == base_value:
        merged_dict[key] = current_value
        continue

    # Both values changed
    merged_dict[key] = current_value
    conflicts[key] = {
        "base": base_value,
        "current": current_value,
        "incoming": incoming_value,
    }

with open(DICT_PATH, "wb") as f:
    f.write(json.dumps(merged_dict, indent=2, sort_keys=True) + "\n")

cmd(["git", "add", DICT_PATH])

if conflicts:
    with open(CONFLICTS_PATH, "wb") as f:
        f.write(json.dumps(conflicts, indent=2, sort_keys=True))
