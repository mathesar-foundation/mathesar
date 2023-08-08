#!/usr/bin/env bash

# The script to build the Debian package, as ran inside the Docker image.

set -ex

# Get the codename from distro env
DIST='ubuntu:jammy'

sudo rm -r build
# we get a read-only copy of the source: make a writeable copy
mkdir build
cp ../requirements.txt build/requirements.txt
cp ../pyproject.toml build/pyproject.toml
cp -r ../mathesar build/mathesar/
cp -r ../config build/config/
cp -r ../db build/db
cp -r ../media build/media
cp ../install.py build/install.py
cp ../manage.py build/manage.py
cp -r debian build/debian
cd build

dpkg-buildpackage -us -uc
