#!/usr/bin/env bash

# The script to build the Debian package

set -ex

sudo rm -f -r build
mkdir -p build
cp ../requirements.txt build/requirements.txt
cp ../pyproject.toml build/pyproject.toml
cp ../MANIFEST.in build/MANIFEST.in
cp -r ../mathesar build/mathesar/
cp -r ../static build/static/
cp -r ../config build/config/
cp -r ../db build/db
cp -r debian build/debian
cd build

dpkg-buildpackage -us -uc
