#!/usr/bin/env python3
"""Decide from the files a change touches whether a CI job needs to run.

Prints "true" or "false". Exits with an error when the changed files cannot be
read, or when the build skip list overlaps the build inputs, so that the
calling job fails instead of skipping checks.

  changed_files.py --base SHA --match REGEX
      true when any changed file fully matches REGEX.

  changed_files.py --base SHA --build-skip-list FILE
      true when any changed file is not covered by the skip list in FILE.
"""
import argparse
import ast
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PACKAGE_SCRIPT = REPO_ROOT / "build-scripts" / "package" / "package.py"


def get_changed_files(base):
    # CI checks out only the tested commit, so fetch the base commit as well.
    has_base = subprocess.run(
        ["git", "cat-file", "-e", f"{base}^{{commit}}"],
        stderr=subprocess.DEVNULL,
    ).returncode == 0
    if not has_base:
        subprocess.run(
            ["git", "fetch", "--no-tags", "--depth=1", "origin", base],
            check=True, stdout=subprocess.DEVNULL,
        )
    diff = subprocess.run(
        ["git", "diff", "--name-only", "--no-renames", base, "HEAD"],
        check=True, capture_output=True, text=True,
    )
    return [line for line in diff.stdout.splitlines() if line]


def read_skip_list(path):
    entries = []
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            entries.append(line)
    return entries


def is_skipped(path, skip_list):
    return any(
        path == entry or (entry.endswith("/") and path.startswith(entry))
        for entry in skip_list
    )


def get_package_inputs():
    """Paths named by string constants at the top level of package.py."""
    tree = ast.parse(PACKAGE_SCRIPT.read_text())
    for node in tree.body:
        if isinstance(node, (ast.Assign, ast.AnnAssign)) and node.value:
            for child in ast.walk(node.value):
                if isinstance(child, ast.Constant) and isinstance(child.value, str):
                    yield child.value


def get_dockerfile_inputs():
    """Sources of COPY and ADD instructions that read the build context."""
    for dockerfile in REPO_ROOT.glob("Dockerfile*"):
        for line in dockerfile.read_text().splitlines():
            parts = line.split()
            if len(parts) < 3 or parts[0].upper() not in ("COPY", "ADD"):
                continue
            args = parts[1:-1]
            if any(arg.startswith("--from") for arg in args):
                continue
            yield from (arg for arg in args if not arg.startswith("--"))


def find_overlaps(skip_list):
    overlaps = []
    inputs = set(get_package_inputs()) | set(get_dockerfile_inputs())
    for raw in sorted(inputs):
        path = raw.removeprefix("./").rstrip("/")
        # The whole build context is copied with "COPY . ."; the build reads
        # only what package.py and the explicit COPY lines name.
        if path in ("", ".") or not (REPO_ROOT / path).exists():
            continue
        contains_skipped = any(
            entry.startswith(path + "/") for entry in skip_list
        )
        if is_skipped(path, skip_list) or is_skipped(path + "/", skip_list) \
                or contains_skipped:
            overlaps.append(path)
    return overlaps


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--match")
    mode.add_argument("--build-skip-list")
    args = parser.parse_args()

    if args.build_skip_list:
        skip_list = read_skip_list(args.build_skip_list)
        overlaps = find_overlaps(skip_list)
        if overlaps:
            print(
                f"{args.build_skip_list} skips paths that the build uses: "
                + ", ".join(overlaps),
                file=sys.stderr,
            )
            return 1
        changed = get_changed_files(args.base)
        needed = not changed or any(
            not is_skipped(path, skip_list) for path in changed
        )
    else:
        pattern = re.compile(args.match)
        changed = get_changed_files(args.base)
        needed = any(pattern.fullmatch(path) for path in changed)

    print("true" if needed else "false")
    return 0


if __name__ == "__main__":
    sys.exit(main())
