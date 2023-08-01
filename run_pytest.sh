#!/usr/bin/env sh

pytest --cov-report=xml:coverage_report/coverage.xml
pytest --cov-report=xml:coverage_report/coverage.xml --cov-append --last-failed --last-failed-no-failures none
pytest --cov-report=xml:coverage_report/coverage.xml --cov-append --last-failed --last-failed-no-failures none
pytest --cov-report=xml:coverage_report/coverage.xml --cov-append --last-failed --last-failed-no-failures none
