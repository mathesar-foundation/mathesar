#!/bin/bash
set -e  # Stop on first error

echo "=== Cleaning Python caches ==="
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} +

echo "=== Applying migrations ==="
python3 manage.py makemigrations
python3 manage.py migrate

echo "=== Running Django tests ==="
python3 manage.py test

echo "=== Running coverage check ==="
coverage run --source='.' manage.py test
coverage report -m

echo "=== Running linter (flake8) ==="
flake8 mathesar

echo "=== All checks passed! Ready to push PR ==="
