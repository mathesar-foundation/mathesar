#!/usr/bin/env bash
set -e

# don't know if this is necessary, I was facing some issues when I was mounting the recent develop code.
pip install -r requirements.txt

python -m mathesar.install --skip-confirm
# Start the Django server on port 8000.
gunicorn config.wsgi -b 0.0.0.0:8000 && fg
