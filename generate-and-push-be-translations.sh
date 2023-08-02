#!/usr/bin/env bash
set -e

# Generate source strings from django code
python manage.py makemessages
echo 'Generated source messages from django app'

# Push django source strings to transifex
# Will ask for transifex token if not found in the .env
./tx push -s
echo 'Pushed django source messages'