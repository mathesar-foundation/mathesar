#!/usr/bin/env bash

# The script to build the Debian package

set -ex

# Get the codename from distro env
DIST='ubuntu:jammy'

sudo rm -f -r build
mkdir -p build
cp ../requirements.txt build/requirements.txt
cp ../pyproject.toml build/pyproject.toml
cp ../MANIFEST.in build/MANIFEST.in
cp -r ../mathesar build/mathesar/
cp -r ../demo build/demo/
cp -r ../config build/config/
cp -r ../db build/db
cp -r ../media build/media
cp -r debian build/debian
cd build

dpkg-buildpackage -us -uc
