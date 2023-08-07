#!/usr/bin/env bash

# The script to build the Debian package, as ran inside the Docker image.

set -ex

# Get the codename from distro env
DIST='ubuntu:jammy'

# we get a read-only copy of the source: make a writeable copy
cp -aT ../mathesar build/mathesar/
cp -aT ../config build/config/
cp -aT ../db build/db
cp -aT ../media build/media
cp -aT ../install.py build/install.py
cp -aT ../manage.py build/manage.py
cp -aT debian build/debian
cd build

dpkg-buildpackage -us -uc
