#!/bin/bash

# =============================
# Pre-PR Check Script
# =============================

echo "=== Starting Pre-PR Checks ==="

# 1️⃣ Fix file ownership (optional, if you ever used sudo by mistake)
echo "=== Fixing file ownership ==="
sudo chown -R $USER:$USER . 2>/dev/null

# 2️⃣ Clean Python caches
echo "=== Cleaning Python caches ==="
find . -name "*.pyc" -exec rm -f {} \; 2>/dev/null
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

# 3️⃣ Check and apply migrations
echo "=== Checking Django migrations ==="
python3 manage.py makemigrations --check --dry-run
python3 manage.py migrate

# 4️⃣ Run all test cases
echo "=== Running all Django tests ==="
python3 manage.py test

# 5️⃣ Run linting (flake8)
echo "=== Running linting ==="
flake8 . --statistics

# 6️⃣ Run code coverage (optional)
echo "=== Running coverage check ==="
coverage run --source='.' manage.py test
coverage report -m

echo "=== Pre-PR Checks Completed ==="
