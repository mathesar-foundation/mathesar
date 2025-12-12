#!/usr/bin/env sh

pytest
pytest --last-failed --last-failed-no-failures none

exitCode=$?

if [ "$exitCode" -eq "5" ]; then
  # `pytest --last-failed --last-failed-no-failures none` returns 5
  # if pytest did not run any tests. This happens when all tests have
  # already been passed in previous run.
  # Since pipelines consider any non-zero status codes as failures,
  # we are returning 0 for this particular case.
  # Refer: https://docs.pytest.org/en/7.1.x/reference/exit-codes.html
  exit 0
else
  exit $exitCode
fi
