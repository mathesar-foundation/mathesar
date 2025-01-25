#!/usr/bin/env bash
set -e

# This script builds Mathesar for various platforms
# and places them within `/dist`.

# NOTE: This build script only with the following pre-requisites installed:
# - node >=v18
# - wget
# - rsync
# - tar

# THIS SCRIPT CAN ONLY BE RUN ON A LINUX x64 MACHINE
# EDIT THE BUILD_RUNNER ENV VARIABLE TO RUN ON A DIFFERENT PLATFORM
# TODO: AUTODETECT MAINTAINER'S PLATFORM
# THIS SETTING DOES NOT CHOOSE WHICH PLATFORM TO BUILD FOR, IT'S FOR THE SCRIPT
# TO IDENTIFY WHICH PLATFORM THE MAINTAINER IS CALLING THE BUILD SCRIPT FROM
# Mathesar is built for all supported platforms no matter what the following value is
export BUILD_RUNNER=linux_x64

mkdir -p dist
rm -rf dist/*

# Create build packages
cd dist/

echo "Obtaining uv binaries"

echo "Getting uv binary for x64 Linux"
wget https://github.com/astral-sh/uv/releases/download/0.5.24/uv-x86_64-unknown-linux-gnu.tar.gz
tar -xzf uv-x86_64-unknown-linux-gnu.tar.gz
mkdir linux_x64
cp -p uv-x86_64-unknown-linux-gnu/uv linux_x64/
rm uv-x86_64-unknown-linux-gnu.tar.gz && rm -rf uv-x86_64-unknown-linux-gnu

echo "Getting uv binary for Apple Silicon macOS"
wget https://github.com/astral-sh/uv/releases/download/0.5.24/uv-aarch64-apple-darwin.tar.gz
tar -xvzf uv-aarch64-apple-darwin.tar.gz
mkdir apple_silicon
cp -p uv-aarch64-apple-darwin/uv apple_silicon/
rm uv-aarch64-apple-darwin.tar.gz && rm -rf uv-aarch64-apple-darwin

echo "Getting uv binary for Intel macOS"
wget https://github.com/astral-sh/uv/releases/download/0.5.24/uv-x86_64-apple-darwin.tar.gz
tar -xvzf uv-x86_64-apple-darwin.tar.gz
mkdir apple_intel
cp -p uv-x86_64-apple-darwin/uv apple_intel/
rm uv-x86_64-apple-darwin.tar.gz && rm -rf uv-x86_64-apple-darwin

cd ..

echo "Creating a temp directory for intermediate build process"
mkdir dist/__temp__/

echo "Copying Licenses and README to __temp__"
cp -p {README.md,LICENSE,THIRDPARTY} dist/__temp__/
rsync -a --exclude-from='.gitignore' LICENSES dist/__temp__/

echo "Copying backend sources to __temp__"
rsync -a --exclude-from='.gitignore' config db mathesar dist/__temp__/
cp -p {manage.py,run-uv.sh,requirements.txt} dist/__temp__/

echo "Building frontend and copying to __temp__"
cd mathesar_ui && npm ci && npm run build && cd ..
rsync -a mathesar/static/mathesar dist/__temp__/mathesar/static/

echo "Installing python in __temp__/__python__/"
mkdir -p dist/__python__/
export UV_PYTHON_INSTALL_DIR=$(pwd)/dist/__python__/
./dist/$BUILD_RUNNER/uv python install 3.13

echo "Compiling translations"
./dist/$BUILD_RUNNER/uv add -r requirements.txt
./dist/$BUILD_RUNNER/uv venv
./dist/$BUILD_RUNNER/uv run manage.py compilemessages

echo "Copy compiled translations: only copy .mo files not .po files"
rsync -a --exclude="*.po" --include="*.mo" translations dist/__temp__/

echo "Copying common files to all distributions"
rsync -a dist/__temp__/* dist/linux_x64/
rsync -a dist/__temp__/* dist/apple_silicon/
rsync -a dist/__temp__/* dist/apple_intel/

echo "Packaging each distribution"
tar -cvzf dist/linux_x64.tar.gz dist/linux_x64
tar -cvzf dist/apple_silicon.tar.gz dist/apple_silicon
tar -cvzf dist/apple_intel.tar.gz dist/apple_intel

echo "Cleaning up"
rm -rf dist/__temp__
rm -rf dist/__python__
rm -rf dist/linux_x64
rm -rf dist/apple_silicon
rm -rf dist/apple_intel

echo "SUCCESS"
