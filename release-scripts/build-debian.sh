#!/usr/bin/env bash

# The script to build the Debian package, as ran inside the Docker image.

set -ex

# Get the codename from distro env
DIST='ubuntu:jammy'

# we get a read-only copy of the source: make a writeable copy
cp -aT ../mathesar build
cp -aT ../config build/
cp -aT ../db build/
cp -aT ../media build/
cp -aT ../install.py build/
cp -aT ../manage.py build/
cp -aT debian build/
cd build


dch -M -l "+$DIST" "build for $DIST"
dch -M -r "" --force-distribution --distribution "$DIST"

dpkg-buildpackage -us -uc

ls -l ..

# copy the build results out, setting perms if necessary
shopt -s nullglob
for i in ../*.deb ../*.dsc ../*.tar.xz ../*.changes ../*.buildinfo; do
    [ -z "$TARGET_USERID" ] || chown "$TARGET_USERID" "$i"
    [ -z "$TARGET_GROUPID" ] || chgrp "$TARGET_GROUPID" "$i"
    mv "$i" /debs
done