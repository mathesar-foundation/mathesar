#!/usr/bin/env python3
"""
Packages Mathesar as a distributable archive.

Note:
- This is a script used only for building Mathesar and its not published to the user.
- If any requirements are added, it should be separate from Mathesar's requirements.
- Primary purpose is to run on our CI/CD.
- For dev & test purposes, execute within Mathesar docker container.

Usage:
  Run this from the root of the Mathesar repo:
    python3 ./build-scripts/packaging/package.py
"""

import sys
import logging
import subprocess
import shutil
import urllib.request
import tarfile
import re
import shlex
from pathlib import Path


UV_VERSION = "0.7.5"
SOURCE_CONTENTS_TO_COPY = [
    "bin",
    "config",
    "db",
    "LICENSE",
    "LICENSES",
    "manage.py",
    "mathesar",
    "pyproject.toml",
    "README.md",
    "requirements.txt",
    "setup",
    "THIRDPARTY",
    "translations",
]
PATTERNS_TO_IGNORE = ["*.po", "__pycache__", "bin/mathesar_dev"]
INSTALLATION_RAW_INPUT_FILE = "build-scripts/install.sh"


logger = logging.getLogger('package_mathesar')
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter("[%(levelname)s] %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)


def require_command(cmd: str):
    if shutil.which(cmd) is None:
        raise EnvironmentError(f"Required command not found in $PATH: {cmd}")


def run_command(cmd: list[str], cwd: Path | None = None) -> None:
    logger.info(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True, cwd=str(cwd) if cwd else None)


def inline_bash_sources(
    rel_path: Path,
    root_dir: Path,
    current_dir: Path,
    seen: set[Path],
    func_defs: dict[str, Path],
    root_file: Path,
) -> list[str]:
    """
    Recursively inline sourced bash files, detect cycles, and ensure no function name clashes.
    """
    file_path = (current_dir / rel_path).resolve()
    if file_path in seen:
        return []  # skip cycles
    if not str(file_path).startswith(str(root_dir)):
        raise PermissionError(f"Attempt to inline file outside project: {file_path}")
    seen.add(file_path)

    lines = file_path.read_text(encoding='utf-8').splitlines()
    output: list[str] = []
    prev_name: str | None = None
    prev_was_name = False
    prev_line_empty = False
    started_processing_file = False

    for line in lines:
        stripped = line.strip()

        # Ignore shebang, top `set` lines in non-root files
        if file_path != root_file and not started_processing_file:
            if stripped.startswith('#!') or re.match(r'^\s*set\b', line):
                continue
            started_processing_file = True

        # Ignore "#<" comment lines
        if stripped.startswith('#<'):
            continue

        # Ignore empty line if previous line is also empty
        if stripped == '':
            if prev_line_empty:
                continue
            prev_line_empty = True
        else:
            prev_line_empty = False

        # Handle source inlining with shlex parsing
        if stripped.startswith("source ") or stripped.startswith("."):
            parts = shlex.split(stripped)
            if len(parts) >= 2:
                src = parts[1]
                inlined = inline_bash_sources(
                    Path(src), root_dir, file_path.parent, seen, func_defs, root_file
                )
                output.append(f"#=======> INLINING STARTS: {src}")
                output.extend(inlined)
                output.append(f"#=======> INLINING ENDS: {src}")
                continue

        # Detect function definitions: multi-line and single-line
        # Case: name() { or function name() {
        m = re.match(r'^\s*(?:function\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*\{', line)
        if m:
            name = m.group(1)
        else:
            # Detect name() on its own line
            m2 = re.match(r'^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*$', line)
            if m2:
                prev_name = m2.group(1)
                prev_was_name = True
                output.append(line)
                continue
            # Detect { following a name() line
            if prev_was_name and stripped == "{":
                name = prev_name  # type: ignore
                prev_was_name = False
            else:
                prev_was_name = False
                name = None

        if name:
            if name in func_defs:
                raise RuntimeError(
                    f"Function name clash: '{name}' in {func_defs[name]} and {file_path}"
                )
            func_defs[name] = file_path

        output.append(line)
    return output


def generate_install_script(base_dir: Path, dist_dir: Path) -> None:
    logger.info("Generating installer script")

    root_file = (base_dir / INSTALLATION_RAW_INPUT_FILE).resolve()
    seen, func_defs = set(), {}
    combined_lines = inline_bash_sources(
        Path(INSTALLATION_RAW_INPUT_FILE), base_dir, base_dir, seen, func_defs, root_file
    )

    # Detect Mathesar version
    sys.path.insert(0, str(base_dir))
    try:
        import mathesar
        mathesar_version = mathesar.__version__
    except Exception:
        logging.error("Unable to detect Mathesar version")
        raise
    finally:
        sys.path.pop(0)

    # Placeholder substitutions (use safe templating if expanded)
    subs = {
        "___MATHESAR_VERSION___": f'"{mathesar_version}"',
        "___UV_VERSION___": f'"{UV_VERSION}"',
    }
    text = "\n".join(combined_lines)
    for key, val in subs.items():
        text = text.replace(key, val)

    installer_path = dist_dir / "install.sh"
    installer_path.write_text(text+"\n", encoding='utf-8')
    installer_path.chmod(installer_path.stat().st_mode | 0o111)
    logger.info(f"Installer written to {installer_path}")


def package_mathesar(base_dir: Path, dist_dir: Path) -> None:
    src_dir = dist_dir / "__source__"

    logger.info("Creating staging folders")
    src_dir.mkdir(parents=True, exist_ok=True)

    uv_installer_path = src_dir / "uv-installer.sh"

    logger.info("Downloading UV installer")
    uv_url = f"https://github.com/astral-sh/uv/releases/download/{UV_VERSION}/uv-installer.sh"

    with urllib.request.urlopen(uv_url, timeout=10) as resp:
        if resp.status != 200:
            raise urllib.error.HTTPError(
                uv_url, resp.status, resp.reason, resp.headers, None
            )
        with uv_installer_path.open("wb") as out_f:
            shutil.copyfileobj(resp, out_f)
    # make it executable
    uv_installer_path.chmod(uv_installer_path.stat().st_mode | 0o111)

    logger.info("Building Mathesar frontend")
    run_command(["npm", "ci"], cwd=base_dir / "mathesar_ui")
    run_command(["npm", "run", "build"], cwd=base_dir / "mathesar_ui")

    logger.info("Compiling Django translations")
    run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], cwd=base_dir)
    run_command([sys.executable, "manage.py", "compilemessages"], cwd=base_dir)

    logger.info("Copying source files")
    for sc in SOURCE_CONTENTS_TO_COPY:
        src = base_dir / sc
        dst = src_dir / sc
        if src.is_file():
            shutil.copy2(src, dst)
        elif src.is_dir():
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*PATTERNS_TO_IGNORE))
        else:
            raise Exception(f"Missing source file/directory: {src}")

    logger.info("Packing archive")
    tar_path = dist_dir / "mathesar.tar.gz"
    with tarfile.open(tar_path, "w:gz") as tf:
        for item in src_dir.iterdir():
            tf.add(item, arcname=item.name)

    generate_install_script(base_dir, dist_dir)

    shutil.rmtree(src_dir)

    logger.info("Packaged Mathesar successfully!")


def main():
    for cmd in ("npm", "gettext", "msgfmt"):
        require_command(cmd)

    base_dir = Path(__file__).resolve().parent.parent.parent
    dist_dir = base_dir / "dist"

    logger.info(f"Cleaning/Recreating {dist_dir}")
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    dist_dir.mkdir(parents=True)

    try:
        package_mathesar(base_dir, dist_dir)
    except Exception:
        logger.exception("Packaging failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
