#!/usr/bin/env bash
set -e

# Pull all enabled languages' translations from transifex
# Will ask for transifex token if not found in the .env
./tx pull -a
echo 'Pulled all translations'

# Generate source strings from django code
python manage.py compilemessages
echo 'Compiled django translations'